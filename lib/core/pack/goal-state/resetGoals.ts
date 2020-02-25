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

import {
    MappedParameter,
    MappedParameters,
    Parameters,
    Value,
} from "@atomist/automation-client/lib/decorators";
import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { Maker } from "@atomist/automation-client/lib/util/constructionUtils";
import {
    bold,
    codeLine,
    italic,
} from "@atomist/slack-messages";
import { chooseAndSetGoals } from "../../../api-helper/goal/chooseAndSetGoals";
import { toRepoTargetingParametersMaker } from "../../../api-helper/machine/handlerRegistrations";
import { RepoTargetingParameters } from "../../../api-helper/machine/RepoTargetingParameters";
import {
    slackSuccessMessage,
    slackWarningMessage,
} from "../../../api-helper/misc/slack/messages";
import { GitHubRepoTargets } from "../../../api/command/target/GitHubRepoTargets";
import {
    CommandListener,
    CommandListenerInvocation,
} from "../../../api/listener/CommandListener";
import { RepoTargets } from "../../../api/machine/RepoTargets";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import {
    fetchBranchTips,
    fetchPushForCommit,
    tipOfBranch,
} from "../../util/graph/queryCommits";

@Parameters()
export class ResetGoalsParameters {

    @MappedParameter(MappedParameters.GitHubRepositoryProvider)
    public providerId: string;

    @Value("name")
    public name: string;

    @Value("version")
    public version: string;

}

export function resetGoalsCommand(
    sdm: SoftwareDeliveryMachine,
    repoTargets: Maker<RepoTargets> = GitHubRepoTargets,
): CommandHandlerRegistration<ResetGoalsParameters & RepoTargetingParameters> {

    return {
        name: "ResetGoalsOnCommit",
        description: "Plan goals on a commit",
        paramsMaker: toRepoTargetingParametersMaker(ResetGoalsParameters, repoTargets),
        listener: resetGoalsOnCommit(sdm),
        intent: [
            `reset goals ${sdm.configuration.name.replace("@", "")}`,
            `plan goals ${sdm.configuration.name.replace("@", "")}`,
        ],
    };
}

function resetGoalsOnCommit(sdm: SoftwareDeliveryMachine): CommandListener<ResetGoalsParameters & RepoTargetingParameters> {
    return async (cli: CommandListenerInvocation<ResetGoalsParameters & RepoTargetingParameters>) => {

        const rules = {
            projectLoader: sdm.configuration.sdm.projectLoader,
            repoRefResolver: sdm.configuration.sdm.repoRefResolver,
            goalsListeners: [...sdm.goalsSetListeners],
            goalSetter: sdm.pushMapping,
            implementationMapping: sdm.goalFulfillmentMapper,
            preferencesFactory: sdm.configuration.sdm.preferenceStoreFactory,
        };

        const slug = `${cli.parameters.targets.repoRef.owner}/${cli.parameters.targets.repoRef.repo}`;
        let repoData;
        try {
            repoData = await fetchBranchTips(cli.context, {
                providerId: cli.parameters.providerId,
                owner: cli.parameters.targets.repoRef.owner,
                repo: cli.parameters.targets.repoRef.repo,
            });
        } catch (e) {
            const text = `Repository ${bold(slug)} not found`;
            return cli.context.messageClient.respond(slackWarningMessage("Set Goal State", text, cli.context));
        }
        const branch = cli.parameters.targets.repoRef.branch || repoData.defaultBranch;
        let sha;
        try {
            sha = cli.parameters.targets.repoRef.sha || tipOfBranch(repoData, branch);
        } catch (e) {
            return cli.context.messageClient.respond(
                slackWarningMessage(
                    "Set Goal State",
                    `Branch ${bold(branch)} not found on ${bold(slug)}`,
                    cli.context));
        }

        const id = GitHubRepoRef.from({
            owner: cli.parameters.targets.repoRef.owner,
            repo: cli.parameters.targets.repoRef.repo,
            sha,
            branch,
        });

        const push = await fetchPushForCommit(cli.context, id, cli.parameters.providerId);

        const goals = await chooseAndSetGoals(rules, {
            context: cli.context,
            credentials: cli.credentials,
            push,
        });

        const slugBranch = `${id.owner}/${id.repo}/${push.branch}`;
        if (goals) {
            await cli.addressChannels(slackSuccessMessage(
                "Plan Goals",
                `Successfully planned goals on ${codeLine(push.after.sha.slice(0, 7))} of ${bold(slugBranch)} to ${italic(goals.name)}`,
                {
                    footer: `${cli.parameters.name}:${cli.parameters.version}`,
                }));
        } else {
            await cli.addressChannels(slackWarningMessage(
                "Plan Goals",
                `No goals found for ${codeLine(push.after.sha.slice(0, 7))} of ${bold(slugBranch)}`,
                cli.context,
                {
                    footer: `${cli.parameters.name}:${cli.parameters.version}`,
                }));
        }

        return Success;
    };
}
