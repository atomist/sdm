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

import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { isBranchCommit } from "@atomist/automation-client/lib/operations/edit/editModes";
import { QueryNoCacheOptions } from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { toFactory } from "@atomist/automation-client/lib/util/constructionUtils";
import { logger } from "@atomist/automation-client/lib/util/logger";
import {
    codeLine,
    italic,
} from "@atomist/slack-messages";
import * as _ from "lodash";
import { CommandListener } from "../../../api/listener/CommandListener";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { CodeTransformRegistration } from "../../../api/registration/CodeTransformRegistration";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import { BranchForName } from "../../../typings/types";
import { LoggingProgressLog } from "../../log/LoggingProgressLog";
import { codeTransformRegistrationToCommand } from "../../machine/handlerRegistrations";
import { RepoTargetingParameters } from "../../machine/RepoTargetingParameters";
import { toMachineOptions } from "../../machine/toMachineOptions";
import { slackErrorMessage } from "../../misc/slack/messages";

/**
 * Wrap a CodeTransform to determine the target branch of the transform.
 *
 * If the target branch, as expressed by the CodeTransformRegistration.transformPresentation,
 * already exists, the wrapped CodeTransform will run against that branch instead of the
 * requested branch.
 * @param codeTransformRegistration
 * @param sdm
 */
export function branchAwareCodeTransform(codeTransformRegistration: CodeTransformRegistration<any>,
                                         sdm: SoftwareDeliveryMachine): CommandHandlerRegistration<RepoTargetingParameters> {
    return {
        ...codeTransformRegistration,
        listener: handleBranchAwareCodeTransform(codeTransformRegistration, sdm),
    };
}

function handleBranchAwareCodeTransform(codeTransformRegistration: CodeTransformRegistration,
                                        sdm: SoftwareDeliveryMachine): CommandListener<RepoTargetingParameters> {
    const codeTransform = toFactory(
        codeTransformRegistrationToCommand(
            toMachineOptions(sdm), codeTransformRegistration))();

    return async ci => {
        const target = ci.parameters.targets;
        if (!target || !target.repoRef || !target.repoRef.owner || !target.repoRef.repo) {
            await ci.context.messageClient.respond(
                slackErrorMessage(
                    "Code Transform",
                    `Can only invoke Code Transform ${italic(ci.commandName)} against a single repository. ` +
                    `Please specify ${codeLine("targets.owner")} and ${codeLine("targets.repo")} parameters.`,
                    ci.context));
            return Success;
        }

        const id = ci.ids[0];

        return sdm.configuration.sdm.projectLoader.doWithProject({
            credentials: ci.credentials,
            id,
            readOnly: true,
            context: ci.context,
            cloneOptions: {
                alwaysDeep: false,
            },
        }, async p => {

            // Obtain the transform presentation to retrieve the target branch
            let branch = id.branch;
            if (codeTransformRegistration.transformPresentation) {
                const editMode = codeTransformRegistration.transformPresentation(
                    {
                        ...ci,
                        progressLog: new LoggingProgressLog(codeTransformRegistration.name, "debug"),
                    },
                    p);
                if (isBranchCommit(editMode)) {
                    branch = editMode.branch;
                }
            }

            // Check if there is already a branch named
            const result = await ci.context.graphClient.query<BranchForName.Query, BranchForName.Variables>({
                name: "BranchForName",
                variables: {
                    branch,
                    owner: id.owner,
                    repo: id.repo,
                },
                options: QueryNoCacheOptions,
            });

            if (!!_.get(result, "Branch[0].id")) {
                // Branch exists; run the code transform on that branch instead
                logger.debug(`Target branch '${branch}' already exists. Redirecting code transform to run against that branch`);
                const newParams = {
                    ...ci.parameters,
                };
                (newParams.targets as any).branch = branch;
                return codeTransform.handle(ci.context, newParams);
            } else {
                // Branch doesn't exist yet; run code transform as is
                logger.debug(`Target branch '${branch}' does not exist. Applying code transform on requested branch`);
                return codeTransform.handle(ci.context, ci.parameters);
            }
        });
    };
}
