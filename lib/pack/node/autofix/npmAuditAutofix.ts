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

import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { isLocalProject } from "@atomist/automation-client/lib/project/local/LocalProject";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as _ from "lodash";
import { execPromise } from "../../../api-helper/misc/child_process";
import { hasFile } from "../../../api/mapping/support/commonPushTests";
import { AutofixRegistration } from "../../../api/registration/AutofixRegistration";
import { DevelopmentEnvOptions } from "../npm/spawn";

const Package = "package.json";

export interface NpmAuditFixResult {
    added: [];
    removed: [];
    updated: [];
    moved: [];
}

/**
 * Options to configure the npm audit support
 */
export interface NpmAuditOptions {
    /** Only process the package lock file */
    packageLockOnly?: boolean;
}

export const DefaultNpmAuditOptions = {
    packageLockOnly: true,
};

/**
 * Autofix to run npm audit fix on a project.
 */
export function npmAuditAutofix(options: NpmAuditOptions = DefaultNpmAuditOptions): AutofixRegistration {
    return {
        name: "npm audit",
        pushTest: hasFile(Package),
        transform: async (p, papi) => {
            if (!isLocalProject(p)) {
                return p;
            }
            const log = papi.progressLog;
            const cwd = p.baseDir;
            try {
                const args = ["audit", "fix", "--json"];
                if (options.packageLockOnly === true) {
                    args.push("--package-lock-only");
                }
                log.write(`Running 'npm audit --fix' in '${cwd}'`);
                const npmAuditResult = await execPromise("npm", args, {
                    cwd,
                    ...DevelopmentEnvOptions,
                });
                log.write(`Completed 'npm audit': ${npmAuditResult.stdout}`);

                const npmAudit = JSON.parse(npmAuditResult.stdout) as NpmAuditFixResult;

                if (
                    _.isEmpty(npmAudit.added) &&
                    _.isEmpty(npmAudit.moved) &&
                    _.isEmpty(npmAudit.removed) &&
                    _.isEmpty(npmAudit.updated)
                ) {
                    await (p as GitProject).revert();
                }
            } catch (e) {
                logger.warn(`Failed to run npm audit fix: ${e.message}`);
            }

            return p;
        },
    };
}
