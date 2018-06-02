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

import { HandlerContext } from "@atomist/automation-client";
import { twoTierDirectoryRepoFinder } from "@atomist/automation-client/operations/common/localRepoFinder";
import { RepoFinder } from "@atomist/automation-client/operations/common/repoFinder";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as _ from "lodash";
import { RepoRefResolver } from "../../../spi/repo-ref/RepoRefResolver";
import { ReposInTeam } from "../../../typings/types";

// Hard-coded limit in GraphQL queries. Not sure why we can't pass this
const PageSize = 100;

/**
 * Use a GraphQL query to find all repos for the current team,
 * or look locally if appropriate, in current working directory
 * @param rrr RepoRefResolver used to find RepoRef from GraphQL result
 * @param cwd directory to look in if this is local
 * @constructor
 */
export function allReposInTeam(rrr: RepoRefResolver, cwd?: string): RepoFinder {
    return (context: HandlerContext) => {
        if (cwd) {
            return twoTierDirectoryRepoFinder(cwd)(context);
        }
        return queryForPage(rrr, context, 0);
    };
}

/**
 * Recursively query for repos from the present offset
 * @param {HandlerContext} context
 * @param {number} offset
 * @return {Promise<RepoRef[]>}
 */
function queryForPage(rrr: RepoRefResolver, context: HandlerContext, offset: number): Promise<RemoteRepoRef[]> {
    return context.graphClient.query<ReposInTeam.Query, ReposInTeam.Variables>({
        name: "ReposInTeam",
        variables: {teamId: context.teamId, offset},
    })
        .then(result => {
            return _.flatMap(result.ChatTeam[0].orgs, org =>
                org.repo.map(r => rrr.toRemoteRepoRef(r, {})));
        })
        .then(repos => {
            return (repos.length < PageSize) ?
                repos :
                queryForPage(rrr, context, offset + PageSize)
                    .then(moreRepos => repos.concat(moreRepos));
        });
}
