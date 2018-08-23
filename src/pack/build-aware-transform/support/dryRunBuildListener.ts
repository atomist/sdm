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

import { logger } from "@atomist/automation-client";
import { BuildListener } from "../../../api/listener/BuildListener";
import { IssueCreationOptions } from "../../../spi/issue/IssueCreationOptions";
import { DryRunMessage } from "./makeBuildAware";

/**
 * React to result of a dry run build to raise a PR or issue
 */
export function dryRunBuildListener(opts: IssueCreationOptions): BuildListener {
    return async bu => {
        const build = bu.build;
        const branch = build.push.branch;

        logger.debug("Assessing dry run for %j: Commit message=%s", bu.id, bu.build.commit.message);
        if (!bu.build.commit.message.includes(DryRunMessage)) {
            logger.info("Not a dry run commit: %j: Commit message=%s", bu.id, bu.build.commit.message);
            return;
        }

        const description = bu.build.commit.message.replace(DryRunMessage, "").trim().split("\n")[0];
        switch (build.status) {
            case "started" :
                logger.info("Tracking dry run build on %j on branch %s,", bu.id, branch);
                // Wait for conclusion
                break;

            case "passed":
                logger.info("Raising PR for successful dry run build on %j", bu.id);
                const title = description;
                const body = bu.build.commit.message;
                await bu.id.raisePullRequest(
                    bu.credentials,
                    title,
                    body,
                    branch,
                    "master");
                break;

            case "failed" :
            case "broken":
                logger.info("Raising issue for failed dry run build on %j on branch %s,", bu.id, branch);
                let issueBody = "Details:\n\n";
                issueBody += !!build.buildUrl ? `[Build log](${build.buildUrl})` : "No build log available";
                issueBody += `\n\n[Branch with failure](${bu.id.url}/tree/${branch} "Failing branch ${branch}")`;
                await opts.issueRouter.raiseIssue(bu.credentials, bu.id, {
                    title: `Failed to ${description}`,
                    body: issueBody,
                });
                break;

            default :
                logger.info("Unexpected build status [%s] issue for failed dry run on %j on branch %s,", bu.build.status, bu.id, branch);
                break;
        }
    };
}
