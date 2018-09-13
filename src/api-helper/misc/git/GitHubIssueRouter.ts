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

import {
    isTokenCredentials,
    ProjectOperationCredentials,
} from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import {
    Issue,
    raiseIssue,
} from "@atomist/automation-client/lib/util/gitHub";
import { IssueRouter } from "../../../spi/issue/IssueRouter";

/**
 * GitHub implementation of IssueRouter
 */
export class GitHubIssueRouter implements IssueRouter {

    public async raiseIssue(credentials: ProjectOperationCredentials,
                            id: RemoteRepoRef,
                            issue: Issue): Promise<any> {
        if (!isTokenCredentials(credentials)) {
            throw new Error("Only token credentials are supported");
        }
        return raiseIssue(credentials.token, id, issue);
    }

}
