/*
 * Copyright © 2018 Atomist, Inc.
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

import { TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { isGitHubTeamMember } from "@atomist/automation-client/secured";
import * as _ from "lodash";
import {
    GoalApprovalRequestVote,
    GoalApprovalRequestVoter,
} from "../../api/registration/GoalApprovalRequestVoter";
import { GitHubLogin } from "../../typings/types";

/**
 * Goal approval request vote implementation that checks for GitHub team membership of the
 * person who is requesting the approval.
 * @param {string} team
 */
export function gitHubTeamVote(team: string = "atomist-automation"): GoalApprovalRequestVoter {
    return async gai => {
        const approval = gai.goal.approval;
        const repo = gai.goal.repo;

        const result = await gai.context.graphClient.query<GitHubLogin.Query, GitHubLogin.Variables>({
            name: "GitHubLogin",
            variables: {
                userId: approval.userId,
                owner: repo.owner,
                providerId: repo.providerId,
            },
        });

        const login = _.get(result, "Team[0].chatTeams[0].members[0].person.gitHubId.login", approval.userId);
        const apiUrl = _.get(result, "Team[0].orgs[0].provider.apiUrl");

        if (await isGitHubTeamMember(repo.owner, login, team, (gai.credentials as TokenCredentials).token, apiUrl)) {
            return {
                vote: GoalApprovalRequestVote.Granted,
            };
        } else {
            return {
                vote: GoalApprovalRequestVote.Denied,
                reason: `User ${login} not in GitHub team ${team}`,
            };
        }
    };
}
