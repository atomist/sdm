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

import { HandlerResult } from "@atomist/automation-client/lib/HandlerResult";
import { File as ProjectFile } from "@atomist/automation-client/lib/project/File";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as _ from "lodash";
import { slackSuccessMessage } from "../../../../api-helper/misc/slack/messages";
import { CommandListenerInvocation } from "../../../../api/listener/CommandListener";
import { SoftwareDeliveryMachine } from "../../../../api/machine/SoftwareDeliveryMachine";
import { CommandHandlerRegistration } from "../../../../api/registration/CommandHandlerRegistration";
import { ProjectLoadingParameters } from "../../../../spi/project/ProjectLoader";
import { KubernetesSyncOptions } from "../config";
import { applySpec } from "../kubernetes/apply";
import { decryptSecret } from "../kubernetes/secret";
import {
    parseKubernetesSpecs,
    specSlug,
} from "../kubernetes/spec";
import { errMsg } from "../support/error";
import { cleanName } from "../support/name";
import { defaultCloneOptions } from "./clone";
import { k8sSpecGlob } from "./diff";
import { isRemoteRepo } from "./repo";

export const KubernetesSync = "KubernetesSync";

/**
 * Command to synchronize the resources in a Kubernetes cluster with
 * the resource specs in the configured sync repo.  The sync repo will
 * be cloned and the resources applied against the Kubernetes API in
 * lexical order sorted by file name.  If no sync repo is configured
 * in the SDM, the command errors.  This command is typically executed
 * on an interval timer by setting the `intervalMinutes`
 * [[KubernetesSyncOptions]].
 *
 * If the SDM configuration says this packs commands should be added,
 * i.e., `sdm.configuration.sdm.k8s.options.addCommands` is `true`,
 * the command will have the intent `kube sync SDM_NAME`.  Otherwise
 * the command will be registered without an intent.
 */
export function kubernetesSync(sdm: SoftwareDeliveryMachine): CommandHandlerRegistration {
    const cmd: CommandHandlerRegistration = {
        name: KubernetesSync,
        listener: repoSync,
    };
    if (_.get(sdm, "configuration.sdm.k8s.options.addCommands", false)) {
        cmd.intent = `kube sync ${cleanName(sdm.configuration.name)}`;
    }
    return cmd;
}

/**
 * Clone the sync repo and apply the specs to the Kubernetes cluster.
 */
export async function repoSync(cli: CommandListenerInvocation): Promise<HandlerResult> {
    const opts: KubernetesSyncOptions = _.get(cli.configuration, "sdm.k8s.options.sync");
    if (!opts) {
        const message = `SDM has no sync options defined`;
        logger.error(message);
        await cli.context.messageClient.respond(message);
        return { code: 2, message };
    }
    if (!isRemoteRepo(opts.repo)) {
        const message = `SDM sync option repo is not a valid remote repo`;
        logger.error(message);
        await cli.context.messageClient.respond(message);
        return { code: 2, message };
    }

    const projectLoadingParameters: ProjectLoadingParameters = {
        credentials: opts.credentials,
        cloneOptions: defaultCloneOptions,
        context: cli.context,
        id: opts.repo,
        readOnly: true,
    };
    const slug = `${opts.repo.owner}/${opts.repo.repo}`;
    try {
        logger.info(`Starting sync of repo ${slug}`);
        await cli.configuration.sdm.projectLoader.doWithProject(projectLoadingParameters, syncApply(opts));
    } catch (e) {
        const message = `Failed to sync repo ${slug}: ${e.message}`;
        logger.error(message);
        await cli.context.messageClient.respond(message);
        return { code: 1, message };
    }
    const result: HandlerResult = {
        code: 0,
        message: `Successfully completed sync of repo ${slug}`,
    };
    logger.info(result.message);
    try {
        await cli.context.messageClient.respond(slackSuccessMessage("Kubernetes Sync", result.message));
    } catch (e) {
        result.code++;
        result.message = `${result.message}; Failed to send response message: ${e.message}`;
        logger.error(result.message);
    }
    return result;
}

/**
 * Return a function that ensures all specs in `syncRepo` have
 * corresponding resources in the Kubernetes cluster.  If the resource
 * does not exist, it is created using the spec.  If it does exist, it
 * is patched using the spec.  Errors are collected and thrown after
 * processing all specs so one bad spec does not stop processing.
 *
 * @param opts Kubernetes sync options
 */
function syncApply(opts: KubernetesSyncOptions): (p: GitProject) => Promise<void> {
    return async syncRepo => {
        const specFiles = await sortSpecs(syncRepo);
        const errors: Error[] = [];
        for (const specFile of specFiles) {
            logger.debug(`Processing spec ${specFile.path}`);
            try {
                const specString = await specFile.getContent();
                const specs = parseKubernetesSpecs(specString);
                for (let spec of specs) {
                    try {
                        if (spec.kind === "Secret" && opts && opts.secretKey) {
                            spec = await decryptSecret(spec, opts.secretKey);
                        }
                        await applySpec(spec);
                    } catch (e) {
                        const slug = specSlug(spec);
                        e.message = `Failed to apply spec '${slug}' from '${specFile.path}': ${errMsg(e)}`;
                        logger.error(e.message);
                        errors.push(e);
                    }
                }
            } catch (e) {
                e.message = `Failed to apply '${specFile.path}': ${errMsg(e)}`;
                logger.error(e.message);
                errors.push(e);
            }
        }
        if (errors.length > 0) {
            errors[0].message = `There were errors during repo sync: ${errors.map(e => e.message).join("; ")}`;
            throw errors[0];
        }
        return;
    };
}

/**
 * Consume stream of files from project and sort them by their `path`
 * property using `localeCompare`.  Any file at the root of the
 * project, i.e., not in a subdirectory, having the extensions
 * ".json", ".yaml", or ".yml` are considered specs.
 *
 * Essentially, this function converts a FileStream into a Promise of
 * sorted ProjectFiles.
 *
 * @param syncRepo Repository of specs to sort
 * @return Sorted array of specs in project
 */
export function sortSpecs(syncRepo: GitProject): Promise<ProjectFile[]> {
    return new Promise<ProjectFile[]>((resolve, reject) => {
        const specsStream = syncRepo.streamFiles(k8sSpecGlob);
        const specs: ProjectFile[] = [];
        specsStream.on("data", f => specs.push(f));
        specsStream.on("error", reject);
        specsStream.on("end", () => resolve(specs.sort((a, b) => a.path.localeCompare(b.path))));
    });
}
