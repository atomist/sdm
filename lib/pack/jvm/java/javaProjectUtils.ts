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

import { LocalProject } from "@atomist/automation-client/lib/project/local/LocalProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import * as projectUtils from "@atomist/automation-client/lib/project/util/projectUtils";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";
import { CodeTransform } from "../../../api/registration/CodeTransform";
import { JavaProjectCreationParameters } from "./generate/JavaProjectCreationParameters";
import { JavaProjectStructure } from "./JavaProjectStructure";

export const AllJavaFiles = "**/*.java";

export const JavaSourceFiles = "**/src/main/java/**/*.java";

export const JavaTestFiles = "**/src/main/test/**/*.java";

export const AllJavaAndKotlinFiles = "**/{*.java,*.kt}";

export const JavaAndKotlinSource = "**/src/main/**/{*.java,*.kt}";

export const KotlinSourceFiles = "**/src/main/kotlin/**/*.kt";

export const ResourcesDir = "**/src/main/resources";

/**
 * Move files from one package to another. Defaults to
 * working on all Java and Kotlin source. Will work for Scala
 * if you pass in the appropriate glob pattern to select the files you want.
 *
 * @param project      project whose files should be moved
 * @param oldPackage   name of package to move from
 * @param newPackage   name of package to move to
 * @param globPattern  glob to select files. Defaults to all Java files in the project
 */
export async function movePackage(
    project: Project,
    oldPackage: string,
    newPackage: string,
    globPattern: string = AllJavaAndKotlinFiles,
): Promise<Project> {
    const pathToReplace = packageToPath(oldPackage);
    const newPath = packageToPath(newPackage);
    logger.debug(
        "Replacing path '%s' with '%s', package '%s' with '%s'",
        pathToReplace,
        newPath,
        oldPackage,
        newPackage,
    );
    await projectUtils.doWithFiles(project, globPattern, async f => {
        await f.replaceAll(oldPackage, newPackage);
        await f.setPath(f.path.replace(pathToReplace, newPath));
    });
    const projectDir = (project as LocalProject).baseDir;
    if (projectDir) {
        cleanEmptyFoldersRecursively(projectDir);
    }
    return project;
}

function cleanEmptyFoldersRecursively(folder: string): void {
    const isDir = fs.statSync(folder).isDirectory();
    if (!isDir) {
        return;
    }
    let files = fs.readdirSync(folder);
    if (files.length > 0) {
        files.forEach(file => {
            const fullPath = path.join(folder, file);
            cleanEmptyFoldersRecursively(fullPath);
        });

        // re-evaluate files; after deleting subfolder
        // we may have parent folder empty now
        files = fs.readdirSync(folder);
    }

    if (files.length === 0) {
        fs.rmdirSync(folder);
        return;
    }
}

/**
 * Convert a Java package (with dots) to a source path
 * @param pkg package
 * @return {string}
 */
export function packageToPath(pkg: string): string {
    return pkg.replace(/\./g, "/");
}

export function classNameFromFqn(fqn: string): string {
    return _.last(fqn.split("."));
}

export function packageNameFromFqn(fqn: string): string {
    return _.dropRight(fqn.split(".")).join(".");
}

/**
 * Rename all instances of a Java or Kotlin class.  This method is somewhat
 * surgical when replacing appearances in Java code but brutal when
 * replacing appearances elsewhere.
 * Renames class stem (start of class name), not just a whole class name
 * Does not change filename, which is necessary in Java.
 * @param project    project whose Java classes should be renamed
 * @param oldClass   name of class to move from
 * @param newClass   name of class to move to
 */
export function renameClass(project: Project, oldClass: string, newClass: string): Promise<Project> {
    logger.debug("Replacing old class stem '%s' with '%s'", oldClass, newClass);
    return projectUtils.doWithFiles(project, AllJavaAndKotlinFiles, async f => {
        if (f.name.includes(oldClass)) {
            await f.rename(f.name.replace(oldClass, newClass));
            const oldClassRe = new RegExp("([( \t<])" + oldClass, "gm");
            await f.replace(oldClassRe, `$1${newClass}`);
        }
    });
}

/**
 * Infer the root package and move it to the new root package
 * @param {string} rootPackage new root package
 * @param {Project} p
 * @return {Promise<Project>}
 */
async function inferStructureAndMovePackage(rootPackage: string, p: Project): Promise<Project> {
    const structure = await JavaProjectStructure.infer(p);
    return !!structure ? movePackage(p, structure.applicationPackage, rootPackage) : p;
}

export const inferStructureAndMovePackageTransform: CodeTransform<JavaProjectCreationParameters> = (p, c, params) =>
    inferStructureAndMovePackage(params.rootPackage, p);
