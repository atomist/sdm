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

import { File as ProjectFile } from "@atomist/automation-client/lib/project/File";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as k8s from "@kubernetes/client-node";
import * as yaml from "js-yaml";
import * as path from "path";

/**
 * Read and parse either JSON or YAML file with basename `base` under
 * `.atomist/kubernetes` in project.  This function looks for
 * `base`.json, `base`.yaml, and then `base`.yml.  If it successfully
 * reads and parses one of them into a truthy value, it returns its
 * parsed value.  If there are mulitple files matching those it looks
 * for, it does _not_ overlay/merge the parsed values.  It stops after
 * the first successfully parsed file.
 */
export async function loadKubernetesSpec(p: Project, base: string): Promise<k8s.KubernetesObject | undefined> {
    for (const ext of ["json", "yaml", "yml"]) {
        const specFile = `${base}.${ext}`;
        const specPath = path.join(".atomist", "kubernetes", specFile);
        const spec = await parseKubernetesSpec(p, specPath);
        if (spec) {
            return spec;
        }
    }
    return undefined;
}

/**
 * Reads and parses Kubernetes JSON or YAML spec from the project.
 * It swallows all exceptions, returning undefined if one occurs.
 *
 * If the `specPath` of the file ends with `.yaml` or `.yml`, the file
 * contents are parsed as YAML.  Otherwise it is parsed as JSON.
 *
 * @param p Project to look for spec file in
 * @param specPath Path of spec file to load
 * @return Parsed object if the spec was successfully read and parsed, undefined otherwise
 */
export async function parseKubernetesSpec(p: Project, specPath: string): Promise<k8s.KubernetesObject | undefined> {
    try {
        const specFile = await p.getFile(specPath);
        if (!specFile) {
            return undefined;
        }
        const spec = await parseKubernetesSpecFile(specFile);
        return spec;
    } catch (e) {
        logger.warn(`Failed to read and parse spec file ${specPath}: ${e.message}`);
    }
    return undefined;
}

/**
 * Reads and parses Kubernetes JSON or YAML spec from the project.
 *
 * If the `specFile.path` of the file ends with `.yaml` or `.yml`, the file
 * contents are parsed as YAML.  Otherwise it is parsed as JSON.
 *
 * @param specFile File object of spec file to load
 * @return Parsed object of the spec
 */
export async function parseKubernetesSpecFile(specFile: ProjectFile): Promise<k8s.KubernetesObject> {
    const specString = await specFile.getContent();
    return parseKubernetesSpecString(specString, specFile.path);
}

/**
 * Parses content string as Kubernetes JSON or YAML spec.  It parses
 * the file as YAML, since JSON is valid YAML.
 *
 * @param specString String representation of Kubernetes spec
 * @param specPath File path of Kubernetes spec file
 * @return Parsed object of the spec
 */
export async function parseKubernetesSpecString(specString: string, specPath: string): Promise<k8s.KubernetesObject> {
    const spec: k8s.KubernetesObject = yaml.safeLoad(specString);
    return spec;
}
