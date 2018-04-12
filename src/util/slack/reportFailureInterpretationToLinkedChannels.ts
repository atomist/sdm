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

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { AddressChannels } from "../../common/slack/addressChannels";
import { InterpretedLog } from "../../spi/log/InterpretedLog";

export async function reportFailureInterpretationToLinkedChannels(stepName: string,
                                                                  interpretation: InterpretedLog,
                                                                  fullLog: { url?: string, log: string },
                                                                  id: RemoteRepoRef,
                                                                  addressChannels: AddressChannels,
                                                                  retryButton?: slack.Action) {
    await addressChannels({
        text: `Failed ${stepName} of ${slack.url(`${id.url}/tree/${id.sha}`, id.sha.substr(0, 6))}`,
        attachments: [{
            title: interpretation.message || "Failure",
            title_link: fullLog.url,
            fallback: "relevant bits",
            text: interpretation.relevantPart,
            color: "#ff5050",
            actions: retryButton ? [retryButton] : [],
        }],
    });
    if (interpretation.includeFullLog) {
        await addressChannels({
            content: fullLog.log,
            fileType: "text",
            fileName: `${stepName}-failure-${id.sha}.log`,
        } as any);
    }
}
