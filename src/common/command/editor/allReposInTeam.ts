import { HandlerContext } from "@atomist/automation-client";
import { twoTierDirectoryRepoFinder } from "@atomist/automation-client/operations/common/localRepoFinder";
import { RepoFinder } from "@atomist/automation-client/operations/common/repoFinder";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as _ from "lodash";
import { ReposInTeam } from "../../../typings/types";
import { toRemoteRepoRef } from "../../../util/git/repoRef";

// Hard-coded limit in GraphQL queries. Not sure why we can't pass this
const PageSize = 100;

/**
 * Use a GraphQL query to find all repos for the current team,
 * or look locally if appropriate, in current working directory
 * @param cwd directory to look in if this is local
 * @constructor
 */
export function allReposInTeam(cwd?: string): RepoFinder {
    return (context: HandlerContext) => {
        if (cwd) {
            return twoTierDirectoryRepoFinder(cwd)(context);
        }
        return queryForPage(context, 0);
    };
}

/**
 * Recursively query for repos from the present offset
 * @param {HandlerContext} context
 * @param {number} offset
 * @return {Promise<RepoRef[]>}
 */
function queryForPage(context: HandlerContext, offset: number): Promise<RemoteRepoRef[]> {
    return context.graphClient.query<ReposInTeam.Query, ReposInTeam.Variables>({
        name: "ReposInTeam",
        variables: {teamId: context.teamId, offset},
    })
        .then(result => {
            return _.flatMap(result.ChatTeam[0].orgs, org =>
                org.repo.map(r => toRemoteRepoRef(r, {})));
        })
        .then(repos => {
            return (repos.length < PageSize) ?
                repos :
                queryForPage(context, offset + PageSize)
                    .then(moreRepos => repos.concat(moreRepos));
        });
}
