/*
 * Copyright © 2019 Atomist, Inc.
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

import * as path from "path";
import * as trace from "stack-trace";
/**
 * Where is this registration located in the code? 
 * Populate this with guessSourceLocation()
 * 
 * This lets an autofix commit message show where the autofix was registered,
 * giving developers the information they need to change it.
 */
export interface RegistrationSourceLocation {
    url: string;
}

/**
 * Use within declaration of an AutofixRegistration:
 * {
 * ...
 * registrationSourceLocation: guessSourceLocation()
 * }
 */
export function guessSourceLocation(): RegistrationSourceLocation | undefined {
    try {

        const fileLocation = guessLocationWithinProject();
        const projectLocation = guessProjectLocation();

        return {
            url: guessUrl(projectLocation, fileLocation),
        };
    } catch (err) {
        return undefined;
    }
}

interface GuessedLocationWithinProject {
    relativePath: string, lineNumber: number
}
function guessLocationWithinProject(): GuessedLocationWithinProject {
    let stack: trace.StackFrame[];
    try {
        // Just throw an error so that we can capture the stack
        throw new Error();
    } catch (err) {
        stack = trace.parse(err);
    }
    // 0 = guessLocationWithinProject, 1 = guessSourceLocation, 2 = the caller, where it's registered
    const registration = stack[2];

    const appRoot = process.cwd();
    const relativePath = registration.getFileName().replace(appRoot, "");
    return {
        relativePath,
        lineNumber: registration.getLineNumber()
    };
}
import * as appRootPath from "app-root-path";

interface GuessedProjectLocation { repoUrl: string, sha?: string }
function guessProjectLocation(): GuessedProjectLocation {

    try {
        const gitInfo: { sha: string, repository: string } =
            require(process.cwd() + path.sep + "git-info.json");

        return {
            repoUrl: remoteUrlToHttp(gitInfo.repository),
            sha: gitInfo.sha
        }
    } catch (gitInfoErr) {

        console.log(gitInfoErr);
        try {
            const packageJson: { repository: string | { url: string } } =
                require(process.cwd() + path.sep + "package.json");

            if (!packageJson.repository) {
                return undefined;
            }
            if (typeof packageJson.repository === "string") {
                return {
                    repoUrl: packageJson.repository
                }
            }
            return {
                repoUrl: packageJson.repository.url
            }

        } catch (packageJsonErr) {
            console.log(packageJsonErr);
            return undefined;
        }
    }

}

function guessUrl(projectLocation: GuessedProjectLocation,
    fileLocation: GuessedLocationWithinProject): string | undefined {
    if (!projectLocation) {
        return undefined;
    }
    const likelyUrl =
        projectLocation.repoUrl.replace(/\/$/, "")
            .replace(/.git$/, "")

    const descendIntoCommit = "blob/" + (projectLocation.sha || "master");

    if (!fileLocation) {
        return likelyUrl + "/" + descendIntoCommit;
    }
    const filePortion = fileLocation.relativePath.replace(/^\//, "") + "#L" + fileLocation.lineNumber;

    return likelyUrl + "/" + descendIntoCommit + "/" + filePortion;
}

function remoteUrlToHttp(remoteUrl: string): string {
    if (remoteUrl.startsWith("http")) {
        return remoteUrl;
    }
    return remoteUrl.replace(/git@(.*):/, "https://$1/");
}