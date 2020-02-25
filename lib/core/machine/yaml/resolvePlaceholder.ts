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

import { logger } from "@atomist/automation-client/lib/util/logger";
import * as _ from "lodash";
import * as os from "os";
import { RepoContext } from "../../../api/context/SdmContext";
import { SdmGoalEvent } from "../../../api/goal/SdmGoalEvent";
import { getGoalVersion } from "../../internal/delivery/build/local/projectVersioner";
import { camelCase } from "./util";

// tslint:disable-next-line:cyclomatic-complexity
export async function resolvePlaceholder(value: string,
                                         goal: SdmGoalEvent,
                                         ctx: Pick<RepoContext, "configuration" | "context" | "skill">,
                                         parameters: Record<string, any>,
                                         raiseError: boolean = true): Promise<string> {
    const placeholderExpression = /\$\{([!.a-zA-Z_-]+)([.:0-9a-zA-Z-_ \" ]*)\}/g;
    if (!placeholderExpression.test(value)) {
        return value;
    }

    placeholderExpression.lastIndex = 0;
    let currentValue = value;
    let result: RegExpExecArray;
    // tslint:disable-next-line:no-conditional-assignment
    while (result = placeholderExpression.exec(currentValue)) {
        const fm = result[0];
        const placeholder = result[1].startsWith("!") ? result[1].slice(1) : result[1];
        const optional = result[1].startsWith("!");
        let envValue = _.get(goal, placeholder) ||
            _.get(ctx.configuration, placeholder) ||
            _.get(ctx.configuration, camelCase(placeholder)) ||
            _.get(ctx.context, placeholder) ||
            _.get(ctx.context, camelCase(placeholder)) ||
            _.get({ parameters }, placeholder) ||
            _.get({ parameters }, camelCase(placeholder)) ||
            _.get({ skill: ctx.skill }, placeholder) ||
            _.get({ skill: ctx.skill}, camelCase(placeholder));

        if (placeholder === "home") {
            envValue = os.userInfo().homedir;
        } else if (placeholder === "push.after.version" && !!goal) {
            envValue = await getGoalVersion({
                context: ctx.context,
                owner: goal.repo.owner,
                repo: goal.repo.name,
                providerId: goal.repo.providerId,
                branch: goal.branch,
                sha: goal.sha,
            });
        }
        const defaultValue = result[2] ? result[2].trim().slice(1) : undefined;

        if (typeof envValue === "string") {
            currentValue = currentValue.split(fm).join(envValue);
            placeholderExpression.lastIndex = 0;
        } else if (typeof envValue === "object" && value === fm) {
            return envValue;
        } else if (defaultValue) {
            currentValue = currentValue.split(fm).join(defaultValue);
            placeholderExpression.lastIndex = 0;
        } else if (optional) {
            currentValue = undefined;
            placeholderExpression.lastIndex = 0;
        } else if (raiseError) {
            logger.warn(`Placeholder replacement failed for '%s', value: '%j', goal: '%j', parameters: '%j'`,
                result[1], value, goal, parameters);
            throw new Error(`Placeholder '${result[1]}' can't be resolved`);
        }
    }
    return currentValue;
}
