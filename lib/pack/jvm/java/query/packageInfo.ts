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

import { Java9FileParser } from "@atomist/antlr";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { gather } from "@atomist/automation-client/lib/tree/ast/astUtils";
import { BoundedElement, toBoundedElement } from "../../util/BoundedElement";
import { JavaPackage } from "./javaPathExpressions";

export interface PackageInfo extends BoundedElement {
    fqn: string;
}

/**
 * Return the imports already in this project
 * @param {Project} p
 * @param {string} path
 * @return {Promise<Import[]>}
 */
export async function packageInfo(p: Project, path: string): Promise<PackageInfo> {
    const packages = await gather(p, {
        parseWith: Java9FileParser,
        globPatterns: path,
        pathExpression: JavaPackage,
        mapper: m => {
            return {
                // TODO this is inelegant pending recursive Antlr grammar fix
                fqn: m.$value.replace(/.*package (.*);/, "$1"),
                ...toBoundedElement(m),
            };
        },
    });
    return packages.length === 1 ? packages[0] : undefined;
}
