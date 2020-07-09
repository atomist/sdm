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

import { Project } from "@atomist/automation-client/lib/project/Project";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as path from "path";
import { CodeTransform } from "../../../../api/registration/CodeTransform";
import { renameClass } from "../../java/javaProjectUtils";
import { SpringBootProjectStructure } from "./SpringBootProjectStructure";
import { computeServiceClassName, SpringProjectCreationParameters } from "./SpringProjectCreationParameters";

/**
 * Infer the Spring Boot structure and rename the class.
 * @param {string} serviceClassName
 * @param {Project} p
 * @return {Promise<Project>}
 */
export async function inferSpringStructureAndRename(serviceClassName: string, p: Project): Promise<Project> {
    return inferSpringStructureAndDo(p, async (project, structure) => {
        return renameClass(project, structure.applicationClassStem, serviceClassName);
    });
}

/**
 * Infer the Spring Boot structure and perform an action
 * @param {string} serviceClassName
 * @param {Project} p
 * @return {Promise<Project>}
 */
export async function inferSpringStructureAndDo(
    p: Project,
    action: (
        p: Project,
        structure: SpringBootProjectStructure,
        params?: SpringProjectCreationParameters,
    ) => Promise<Project>,
    params?: SpringProjectCreationParameters,
): Promise<Project> {
    const structures = await SpringBootProjectStructure.inferFromJavaOrKotlin(p);
    if (!structures || structures.length === 0) {
        logger.warn("Spring Boot project structure not found");
        return p;
    } else if (structures.length > 1) {
        const msg =
            `Found more than one Spring Boot application annotation in files: ` +
            structures.map(s => path.join(s.appClassFile.path, s.appClassFile.name)).join(",");
        logger.warn(msg);
        throw new Error(msg);
    } else {
        return action(p, structures[0], params);
    }
}

export const inferSpringStructureAndRenameTransform: CodeTransform<SpringProjectCreationParameters> = (p, c, params) =>
    inferSpringStructureAndRename(computeServiceClassName(params, p), p);

export function inferSpringStructureAndDoTransform(
    action: (p: Project, structure: SpringBootProjectStructure) => Promise<Project>,
): CodeTransform<SpringProjectCreationParameters> {
    return (p, c, params) => inferSpringStructureAndDo(p, action, params);
}
