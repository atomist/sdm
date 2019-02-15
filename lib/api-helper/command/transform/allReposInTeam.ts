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

import {
    HandlerContext,
    RemoteRepoRef,
    RepoFinder,
} from "@atomist/automation-client";
import * as _ from "lodash";
import { RepoRefResolver } from "../../../spi/repo-ref/RepoRefResolver";
import { ReposInTeam } from "../../../typings/types";

const PageSize = 100;

/**
 * Use a GraphQL query to find all repos for the current team
 * @param rrr RepoRefResolver used to find RepoRef from GraphQL result
 * @constructor
 */
export function allReposInTeam(rrr: RepoRefResolver): RepoFinder {
    return (context: HandlerContext) => {
        return queryForPage(rrr, context, 0);
    };
}

/**
 * Recursively query for repos from the present offset
 * @param rrr repo ref resolver to use
 * @param {HandlerContext} context
 * @param {number} offset
 * @return {Promise<RepoRef[]>}
 */
function queryForPage(rrr: RepoRefResolver, context: HandlerContext, offset: number): Promise<RemoteRepoRef[]> {
    return context.graphClient.query<ReposInTeam.Query, ReposInTeam.Variables>({
        name: "ReposInTeam",
        variables: { offset, size: PageSize },
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
