/*
 * Copyright © 2020 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { configurationValue } from "@atomist/automation-client/lib/configuration";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { File as ProjectFile } from "@atomist/automation-client/lib/project/File";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import * as projectUtils from "@atomist/automation-client/lib/project/util/projectUtils";
import { execPromise } from "@atomist/automation-client/lib/util/child_process";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as k8s from "@kubernetes/client-node";
import { CachingProjectLoader } from "../../../../api-helper/project/CachingProjectLoader";
import {
    ProjectLoader,
    ProjectLoadingParameters,
} from "../../../../spi/project/ProjectLoader";
import {
    KubernetesSyncOptions,
    validSyncOptions,
} from "../config";
import { parseKubernetesSpecFile } from "../deploy/spec";
import {
    appName,
    isKubernetesApplication,
    KubernetesDelete,
} from "../kubernetes/request";
import {
    kubernetesSpecFileBasename,
    kubernetesSpecStringify,
    KubernetesSpecStringifyOptions,
} from "../kubernetes/spec";
import { logRetry } from "../support/retry";
import { defaultCloneOptions } from "./clone";
import { k8sSpecGlob } from "./diff";
import { commitTag } from "./tag";

export type SyncAction = "upsert" | "delete";

/**
 * Synchronize changes from deploying app to the configured syncRepo.
 * If no syncRepo is configured, do nothing.
 *
 * @param app Kubernetes application change that triggered the sync
 * @param resources Kubernetes resource objects to synchronize
 * @param action Action performed, "upsert" or "delete"
 */
export async function syncApplication(app: KubernetesDelete, resources: k8s.KubernetesObject[], action: SyncAction = "upsert"): Promise<void> {
    const slug = appName(app);
    const syncOpts = configurationValue<Partial<KubernetesSyncOptions>>("sdm.k8s.options.sync", {});
    if (!validSyncOptions(syncOpts)) {
        return;
    }
    const syncRepo = syncOpts.repo as RemoteRepoRef;
    if (resources.length < 1) {
        return;
    }
    const projectLoadingParameters: ProjectLoadingParameters = {
        credentials: syncOpts.credentials,
        cloneOptions: defaultCloneOptions,
        id: syncRepo,
        readOnly: false,
    };
    const projectLoader = configurationValue<ProjectLoader>("sdm.projectLoader", new CachingProjectLoader());
    try {
        await projectLoader.doWithProject(projectLoadingParameters, syncResources(app, resources, action, syncOpts));
    } catch (e) {
        e.message = `Failed to perform sync resources from ${slug} to sync repo ${syncRepo.owner}/${syncRepo.repo}: ${e.message}`;
        logger.error(e.message);
        throw e;
    }
    return;
}

export interface ProjectFileSpec {
    file: ProjectFile;
    spec: k8s.KubernetesObject;
}

/**
 * Update the sync repo with the changed resources from a
 * KubernetesApplication.  For each changed resource in `resources`,
 * loop through all the existing Kubernetes spec files, i.e., those
 * that match [[k8sSpecGlob]], to see if the apiVersion, kind, name,
 * and namespace, which may be undefined, match.  If a match is found,
 * update that spec file.  If no match is found, create a unique file
 * name and store the resource spec in it.  If changes are made,
 * commit and push the changes.
 *
 * @param app Kubernetes application object
 * @param resources Resources that were upserted as part of this application
 * @param action Action performed, "upsert" or "delete"
 * @param opts Repo sync options, passed to the sync action
 * @return Function that updates the sync repo with the resource specs
 */
export function syncResources(
    app: KubernetesDelete,
    resources: k8s.KubernetesObject[],
    action: SyncAction,
    opts: KubernetesSyncOptions,
): (p: GitProject) => Promise<void> {

    return async syncProject => {
        const slug = `${syncProject.id.owner}/${syncProject.id.repo}`;
        const aName = appName(app);
        const specs: ProjectFileSpec[] = [];
        await projectUtils.doWithFiles(syncProject, k8sSpecGlob, async file => {
            try {
                const spec = await parseKubernetesSpecFile(file);
                specs.push({ file, spec });
            } catch (e) {
                logger.warn(`Failed to process sync repo ${slug} spec ${file.path}, ignoring: ${e.message}`);
            }
        });
        const [syncAction, syncVerb] = (action === "delete") ? [resourceDeleted, "Delete"] : [resourceUpserted, "Update"];
        for (const resource of resources) {
            const fileSpec = matchSpec(resource, specs);
            await syncAction(resource, syncProject, fileSpec, opts);
        }
        if (await syncProject.isClean()) {
            return;
        }
        try {
            const v = isKubernetesApplication(app) ? app.image.replace(/^.*:/, ":") : "";
            await syncProject.commit(`${syncVerb} ${aName}${v}\n\n[atomist:generated] ${commitTag()}\n`);
        } catch (e) {
            e.message = `Failed to commit resource changes for ${aName} to sync repo ${slug}: ${e.message}`;
            logger.error(e.message);
            throw e;
        }
        try {
            await syncProject.push();
        } catch (e) {
            logger.warn(`Failed on initial sync repo ${slug} push attempt: ${e.message}`);
            try {
                await logRetry(async () => {
                    const pullResult = await execPromise("git", ["pull", "--rebase"], { cwd: syncProject.baseDir });
                    logger.debug(`Sync project 'git pull --rebase': ${pullResult.stdout}; ${pullResult.stderr}`);
                    await syncProject.push();
                }, `sync project ${slug} git pull and push`);
            } catch (e) {
                e.message = `Failed sync repo ${slug} pull and rebase retries: ${e.message}`;
                logger.error(e.message);
                throw e;
            }
        }
    };
}

/**
 * Persist the creation of or update to a resource to the sync repo
 * project.
 *
 * @param resource Kubernetes resource that was upserted
 * @param p Sync repo project
 * @param fs File and spec object that matches resource, may be undefined
 */
async function resourceUpserted(resource: k8s.KubernetesObject, p: Project, fs: ProjectFileSpec, opts: KubernetesSyncOptions): Promise<void> {
    let format: KubernetesSyncOptions["specFormat"] = "yaml";
    if (fs && fs.file) {
        format = (/\.ya?ml$/.test(fs.file.path)) ? "yaml" : "json";
    } else if (opts.specFormat) {
        format = opts.specFormat;
    }
    const stringifyOptions: KubernetesSpecStringifyOptions = {
        format,
        secretKey: opts.secretKey,
    };
    const resourceString = await kubernetesSpecStringify(resource, stringifyOptions);
    if (fs) {
        await fs.file.setContent(resourceString);
    } else {
        const specPath = await uniqueSpecFile(resource, p, format);
        await p.addFile(specPath, resourceString);
    }
}

/**
 * Safely persist the deletion of a resource to the sync repo project.
 * If `fs` is `undefined`, do nothing.
 *
 * @param resource Kubernetes resource that was upserted
 * @param p Sync repo project
 * @param fs File and spec object that matches resource, may be `undefined`
 */
async function resourceDeleted(resource: k8s.KubernetesObject, p: Project, fs: ProjectFileSpec): Promise<void> {
    if (fs) {
        await p.deleteFile(fs.file.path);
    }
}

/**
 * Determine if two Kubernetes resource specifications represent the
 * same object.  When determining if they are the same, only the kind,
 * name, and namespace, which may be `undefined`, must match.  The
 * apiVersion is not considered when matching because the same
 * resource can appear under different API versions.  Other object
 * properties are not considered.
 *
 * @param a First Kubernetes object spec to match
 * @param b Second Kubernetes object spec to match
 * @return `true` if specs match, `false` otherwise
 */
export function sameObject(a: k8s.KubernetesObject, b: k8s.KubernetesObject): boolean {
    return a && b && a.metadata && b.metadata &&
        a.kind === b.kind &&
        a.metadata.name === b.metadata.name &&
        a.metadata.namespace === b.metadata.namespace;
}

/**
 * Search `fileSpecs` for a spec that matches `spec`.  To be
 * considered a match, the kind, name, and namespace, which may be
 * undefined, must match.  The apiVersion is not considered when
 * matching because the same resource can appear under different API
 * versions.
 *
 * @param spec Kubernetes object spec to match
 * @param fileSpecs Array of spec and file objects to search
 * @return First file and spec object to match spec or `undefined` if no match is found
 */
export function matchSpec(spec: k8s.KubernetesObject, fileSpecs: ProjectFileSpec[]): ProjectFileSpec | undefined {
    return fileSpecs.find(fs => sameObject(spec, fs.spec));
}

/**
 * Return a unique name for a resource spec that lexically sorts so
 * resources that should be created earlier than others sort earlier
 * than others.
 *
 * @param resource Kubernetes object spec
 * @param p Kubernetes spec project
 * @return Unique spec file name that sorts properly
 */
export async function uniqueSpecFile(resource: k8s.KubernetesObject, p: Project, format: KubernetesSyncOptions["specFormat"]): Promise<string> {
    const specRoot = kubernetesSpecFileBasename(resource);
    const specExt = `.${format}`;
    let specPath = specRoot + specExt;
    while (await p.getFile(specPath)) {
        specPath = specRoot + "_" + guid().split("-")[0] + specExt;
    }
    return specPath;
}
