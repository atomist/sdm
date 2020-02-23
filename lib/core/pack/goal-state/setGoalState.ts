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
    Parameter,
    Parameters,
} from "@atomist/automation-client/lib/decorators";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import {
    buttonForCommand,
    menuForCommand,
} from "@atomist/automation-client/lib/spi/message/MessageClient";
import { Maker } from "@atomist/automation-client/lib/util/constructionUtils";
import {
    bold,
    codeLine,
    italic,
    SlackMessage,
} from "@atomist/slack-messages";
import * as _ from "lodash";
import { fetchGoalsForCommit } from "../../../api-helper/goal/fetchGoalsOnCommit";
import { updateGoal } from "../../../api-helper/goal/storeGoals";
import { toRepoTargetingParametersMaker } from "../../../api-helper/machine/handlerRegistrations";
import { RepoTargetingParameters } from "../../../api-helper/machine/RepoTargetingParameters";
import {
    slackFooter,
    slackSuccessMessage,
    slackWarningMessage,
} from "../../../api-helper/misc/slack/messages";
import { GitHubRepoTargets } from "../../../api/command/target/GitHubRepoTargets";
import { RepoTargets } from "../../../api/machine/RepoTargets";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import { SdmGoalState } from "../../../typings/types";
import {
    fetchBranchTips,
    tipOfBranch,
} from "../../util/graph/queryCommits";

enum SdmGoalStateOrder {
    planned,
    requested,
    waiting_for_pre_approval,
    pre_approved,
    in_process,
    waiting_for_approval,
    approved,
    success,
    failure,
    stopped,
    skipped,
    canceled,
}

@Parameters()
class SetGoalStateParameters {

    @MappedParameter(MappedParameters.GitHubRepositoryProvider)
    public providerId: string;

    @Parameter({ required: false })
    public goal: string;

    @Parameter({ required: false })
    public state: SdmGoalState;

    @Parameter({ required: false })
    public msgId: string;

    @Parameter({ required: false, type: "boolean" })
    public cancel: boolean;
}

export function setGoalStateCommand(sdm: SoftwareDeliveryMachine,
                                    repoTargets: Maker<RepoTargets> = GitHubRepoTargets)
    : CommandHandlerRegistration<SetGoalStateParameters & RepoTargetingParameters> {
    return {
        name: "SetGoalState",
        description: "Set state of a particular goal",
        intent: [`set goal state ${sdm.configuration.name.replace("@", "")}`],
        paramsMaker: toRepoTargetingParametersMaker(SetGoalStateParameters, repoTargets),
        listener: async chi => {
            if (!chi.parameters.msgId) {
                chi.parameters.msgId = guid();
            }
            let repoData;
            try {
                repoData = await fetchBranchTips(chi.context, {
                    providerId: chi.parameters.providerId,
                    owner: chi.parameters.targets.repoRef.owner,
                    repo: chi.parameters.targets.repoRef.repo,
                });
            } catch (e) {
                return chi.context.messageClient.respond(
                    slackWarningMessage(
                        "Set Goal State",
                        `Repository ${bold(`${
                            chi.parameters.targets.repoRef.owner}/${chi.parameters.targets.repoRef.repo}`)} not found`,
                        chi.context),
                    { id: chi.parameters.msgId });
            }
            const branch = chi.parameters.targets.repoRef.branch || repoData.defaultBranch;
            let sha;
            try {
                sha = chi.parameters.targets.repoRef.sha || tipOfBranch(repoData, branch);
            } catch (e) {
                return chi.context.messageClient.respond(
                    slackWarningMessage(
                        "Set Goal State",
                        `Branch ${bold(branch)} not found on ${bold(`${
                            chi.parameters.targets.repoRef.owner}/${chi.parameters.targets.repoRef.repo}`)}`,
                        chi.context),
                    { id: chi.parameters.msgId });
            }
            const id = GitHubRepoRef.from({
                owner: chi.parameters.targets.repoRef.owner,
                repo: chi.parameters.targets.repoRef.repo,
                sha,
                branch,
            });

            const newParams = {
                ...chi.parameters,
                targets: {
                    owner: id.owner,
                    repo: id.repo,
                    branch: id.branch,
                    sha: id.sha,
                },
            } as any;

            if (chi.parameters.cancel) {
                return chi.context.messageClient.respond(
                    slackSuccessMessage(
                        "Set Goal State",
                        "Successfully canceled setting goal state"),
                    { id: chi.parameters.msgId });
            } else if (!chi.parameters.goal) {
                const goals = await fetchGoalsForCommit(chi.context, id, chi.parameters.providerId);
                const goalSets = _.groupBy(goals, "goalSetId");
                const optionsGroups = _.map(goalSets, (v, k) => {
                    return {
                        text: k.slice(0, 7),
                        options: v.map(g => ({
                            text: `${g.name} - ${g.state}`,
                            value: JSON.stringify({ id: (g as any).id, name: g.name, state: g.state }),
                        })).sort((o1, o2) => o1.text.localeCompare(o2.text)),
                    };
                });

                const msg: SlackMessage = {
                    attachments: [{
                        title: "Select Goal",
                        text: `Please select one of the following goals on ${
                            codeLine(sha.slice(0, 7))} of ${bold(`${id.owner}/${id.repo}/${branch}`)}:`,
                        actions: [
                            menuForCommand({
                                    text: "Goals",
                                    options: optionsGroups,
                                },
                                "SetGoalState",
                                "goal",
                                newParams),
                            buttonForCommand(
                                { text: "Cancel" },
                                "SetGoalState",
                                { ...newParams, cancel: true }),
                        ],
                        fallback: "Select Goal",
                        footer: slackFooter(),
                    }],
                };

                return chi.context.messageClient.respond(msg, { id: chi.parameters.msgId });
            } else if (!chi.parameters.state) {
                const goal = JSON.parse(chi.parameters.goal);
                const states = _.map(SdmGoalState, v =>
                    ({ text: v, value: v }))
                    .sort((s1, s2) => {
                        return SdmGoalStateOrder[s1.value] - SdmGoalStateOrder[s2.value];
                    });
                const msg: SlackMessage = {
                    attachments: [{
                        title: "Select Goal State",
                        text: `Please select the desired state of goal ${italic(goal.name)} on ${codeLine(sha.slice(0, 7))} of ${
                            bold(`${id.owner}/${id.repo}/${branch}`)}:`,
                        actions: [
                            menuForCommand({
                                text: "Goal States",
                                options: [
                                    { text: "current state", options: states.filter(s => s.value === goal.state) },
                                    { text: "available states", options: states.filter(s => s.value !== goal.state) },
                                ],
                            }, "SetGoalState", "state", newParams),
                            buttonForCommand(
                                { text: "Cancel" },
                                "SetGoalState",
                                { ...newParams, cancel: true }),
                        ],
                        fallback: "Select Goal",
                        footer: slackFooter(),
                    }],
                };

                return chi.context.messageClient.respond(msg, { id: chi.parameters.msgId });
            } else {
                const goal = JSON.parse(chi.parameters.goal);
                const goals = await fetchGoalsForCommit(chi.context, id, chi.parameters.providerId);
                const sdmGoal = goals.find(g => (g as any).id === goal.id);

                await updateGoal(chi.context, sdmGoal, {
                    state: chi.parameters.state,
                    description: sdmGoal.description,
                });

                return chi.context.messageClient.respond(
                    slackSuccessMessage(
                        "Set Goal State",
                        `Successfully set state of ${italic(goal.name)} on ${codeLine(sha.slice(0, 7))} of ${
                            bold(`${id.owner}/${id.repo}/${branch}`)} to ${italic(chi.parameters.state)}`),
                    { id: chi.parameters.msgId });
            }
        },
    };
}
