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
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { AddressChannels } from "../../api/context/addressChannels";
import { InterpretedLog } from "../../spi/log/InterpretedLog";

export async function reportFailureInterpretation(stepName: string,
                                                  interpretation: InterpretedLog | undefined,
                                                  fullLog: { url?: string, log: string },
                                                  id: RemoteRepoRef,
                                                  addressChannels: AddressChannels,
                                                  retryButton?: slack.Action) {
    if (!interpretation) {
        if (fullLog.url) {
            logger.info("No log interpretation. Log available at: " + fullLog.url);
            return;
        }
        logger.info("No log interpretation, no log URL. Sending full log to Slack");
        await addressChannels({
            content: fullLog.log,
            fileType: "text",
            fileName: `${stepName}-failure-${id.sha}.log`,
        } as any);
        return;
    }
    await addressChannels({
        text: `Failed ${stepName} of ${slack.url(`${id.url}/tree/${id.sha}`, id.sha.substr(0, 7))}`,
        attachments: [{
            title: interpretation.message || "Failure",
            title_link: fullLog.url,
            fallback: "relevant bits",
            text: interpretation.relevantPart,
            color: "#ff5050",
            actions: retryButton ? [retryButton] : [],
        }],
    });
    const includeFullLogByDefault = !fullLog.url; // if there is no link, include it by default
    const shouldIncludeFullLog = "includeFullLog" in interpretation ? interpretation.includeFullLog : includeFullLogByDefault;
    if (shouldIncludeFullLog) {
        logger.debug("sending full log to slack. url is %s, includeFullLog is %s", fullLog.url, interpretation.includeFullLog);
        await addressChannels({
            content: fullLog.log,
            fileType: "text",
            fileName: `${stepName}-failure-${id.sha}.log`,
        } as any);
    }
}
