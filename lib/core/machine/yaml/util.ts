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

import { File } from "@atomist/automation-client/lib/project/File";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import * as camelcaseKeys from "camelcase-keys";
import * as changeCase from "change-case";
import * as yaml from "js-yaml";
import * as _ from "lodash";
import { AtomistYamlFileName } from "./schema";

/**
 * Watches the provided paths for changes when in watch mode
 */
export function watchPaths(paths: string[]): void {
    process.env.ATOMIST_WATCH_PATHS =
        _.uniq([...(process.env.ATOMIST_WATCH_PATHS?.split(",") || []), ...paths]).join(",");
}

/**
 * Recursively camelCase the provide object
 */
export function camelCase(obj: any): any {
    if (typeof obj === "string") {
        return camelCaseString(obj);
    } else if (Array.isArray(obj)) {
        return obj.map(camelCase);
    } else if (!obj) {
        return obj;
    }
    return camelcaseKeys(obj, { deep: true });
}

export async function getYamlFile<D = any>(project: GitProject,
                                           name: string = AtomistYamlFileName,
                                           options: { parse: boolean, camelCase: boolean } = {
    parse: true,
    camelCase: true,
})
    : Promise<{ file: File, content: string, docs?: D[] } | undefined> {
    if (await project.hasFile(name)) {
        const file = await project.getFile(name);
        const content = await file.getContent();
        const docs = options.parse ? yaml.safeLoadAll(content) : undefined;
        return {
            file,
            content,
            docs: options.camelCase && !!docs ? camelCase(docs) : docs,
        };
    }
    return undefined;
}

function camelCaseString(key: string): string {
    return key.split(".").map(k => changeCase.camel(k)).join(".");
}
