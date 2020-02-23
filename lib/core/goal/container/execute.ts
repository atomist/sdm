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

import { resolvePlaceholders } from "@atomist/automation-client/lib/configuration";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as os from "os";
import * as path from "path";
import { doWithProject } from "../../../api-helper/project/withProject";
import {
    goal,
    GoalWithFulfillment,
} from "../../../api/goal/GoalWithFulfillment";
import { resolvePlaceholder } from "../../machine/yaml/resolvePlaceholder";
import {
    ContainerProgressReporter,
    ContainerSecrets,
} from "./container";
import { prepareSecrets } from "./provider";
import {
    containerEnvVars,
    prepareInputAndOutput,
    processResult,
} from "./util";

export interface ExecuteRegistration {
    cmd: string;
    args: string | string[];
    secrets?: ContainerSecrets;
}

export function execute(name: string,
                        registration: ExecuteRegistration): GoalWithFulfillment {
    const uniqueName = name.replace(/ /g, "_");
    const executeGoal = goal(
        { displayName: name, uniqueName },
        doWithProject(async gi => {
            const { goalEvent, project } = gi;

            // Resolve placeholders
            const registrationToUse = _.cloneDeep(registration);
            await resolvePlaceholders(
                registrationToUse,
                value => resolvePlaceholder(value, gi.goalEvent, gi, gi.parameters));

            const env = {
                ...process.env,
            };

            // Mount the secrets
            let secrets;
            if (!!registrationToUse.secrets) {
                secrets = await prepareSecrets({ secrets: registrationToUse.secrets }, gi);
                secrets.env.forEach(e => env[e.name] = e.value);
                for (const f of secrets.files) {
                    await fs.ensureDir(path.dirname(f.mountPath));
                    await fs.writeFile(f.mountPath, f.value);
                }
            }

            const goalName = goalEvent.uniqueName.split("#")[0].toLowerCase();
            const namePrefix = "sdm-";
            const nameSuffix = `-${goalEvent.goalSetId.slice(0, 7)}-${goalName}`;
            const tmpDir = path.join(os.homedir(), ".atomist", "tmp", goalEvent.repo.owner, goalEvent.repo.name, goalEvent.goalSetId);
            const inputDir = path.join(tmpDir, `${namePrefix}tmp-${guid()}${nameSuffix}`);
            const outputDir = path.join(tmpDir, `${namePrefix}tmp-${guid()}${nameSuffix}`);

            await prepareInputAndOutput(inputDir, outputDir, gi);
            (await containerEnvVars(goalEvent, gi, project.baseDir, inputDir, outputDir)).forEach(e => env[e.name] = e.value);

            try {
                const result = await gi.spawn(
                    registrationToUse.cmd,
                    registrationToUse.args,
                    { env });
                if (result.code === 0) {
                    const outputFile = path.join(outputDir, "result.json");
                    if ((await fs.pathExists(outputFile))) {
                        return await processResult(await fs.readJson(outputFile), gi);
                    }
                } else {
                    return {
                        code: result.code,
                    };
                }
            // TODO catch
            } finally {
                // Cleanup secrets;
                if (!!secrets) {
                    for (const f of secrets.files) {
                        await fs.unlink(f.mountPath);
                    }
                }
                // Delete tmpDir
                if (!!tmpDir) {
                    await fs.remove(tmpDir);
                }
            }
            return {
                code: 0,
            };

        }, {
            readOnly: false,
            detachHead: true,
        }), { progressReporter: ContainerProgressReporter });
    return executeGoal;
}
