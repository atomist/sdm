/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Parameter, Parameters } from "@atomist/automation-client";
import { GitBranchRegExp } from "@atomist/automation-client/operations/common/params/gitHubPatterns";
import { BranchCommit, EditMode, PullRequest } from "@atomist/automation-client/operations/edit/editModes";

/**
 * Allow user to specify a branch (with default master).
 * Set 'newBranch' to true to create a unique new branch.
 */
@Parameters()
export class RequestedCommitParameters {

    @Parameter({
            required: false,
            description: "Branch to use. Default is 'master'.",
            ...GitBranchRegExp,
        },
    )
    private readonly branch = "master";

    // TODO should really be a boolean, investigate client issue
    @Parameter({required: false, pattern: /(true|false)/})
    private readonly newBranch: string = "false";

    @Parameter({required: false})
    // tslint gets the following variable declaration wrong, producing a compile error
    // tslint:disable-next-line:prefer-readonly
    private commitMessage = "Command handler commit from Atomist";

    private branchUsed: string;

    @Parameter({
        required: false,
        pattern: /^(pr|branch)$/,
        validInput: "How to present commit: 'pr' or 'branch', defaults to 'branch'",
    })
    public presentAs: "pr" | "branch" = "branch";

    constructor(commitMessage?: string) {
        if (!!commitMessage) {
            this.commitMessage = commitMessage;
        }
    }

    get branchToUse() {
        if (!!this.branchUsed) {
            return this.branchUsed;
        }
        this.branchUsed = this.newBranch === "true" ?
            "atomist-" + new Date().getTime() :
            this.branch;
        return this.branchUsed;
    }

    get editMode(): EditMode {
        switch (this.presentAs) {
            case "pr" :
                return new PullRequest(
                    this.branchToUse,
                    this.commitMessage,
                    this.commitMessage);
            case "branch" :
                return {branch: this.branchToUse, message: this.commitMessage} as BranchCommit;
        }
    }

}
