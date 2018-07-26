import { TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { isGitHubTeamMember } from "@atomist/automation-client/secured";
import {
    GitHubLogin,
    GoalApprovalRequestVote,
    GoalApprovalRequestVoteResult,
    GoalApprovalRequestVoterRegistration,
} from "../..";
import * as _ from "lodash";

function gitHubTeamGoalVote(team: string): GoalApprovalRequestVote {
    return async gai => {
        const approval = gai.goal.approval;

        const result = await gai.context.graphClient.query<GitHubLogin.Query, GitHubLogin.Variables>({
            name: "GitHubLogin",
            variables: {
                userId: approval.userId,
                owner: gai.goal.repo.owner,
                providerId: gai.goal.repo.providerId,
            },
        });

        const login = _.get(result, "Team[0].chatTeams[0].members[0].person.gitHubId.login", approval.userId);
        const apiUrl = _.get(result, "Team[0].orgs[0].provider.apiUrl");

        if (await isGitHubTeamMember(gai.goal.repo.owner, login, team, (gai.credentials as TokenCredentials).token, apiUrl)) {
            return GoalApprovalRequestVoteResult.Granted;
        } else {
            return GoalApprovalRequestVoteResult.Denied;
        }
    };
}

export function gitHubTeamGoal(team: string = "atomist-automation"): GoalApprovalRequestVoterRegistration {
    return {
        vote: gitHubTeamGoalVote(team),
    };
}