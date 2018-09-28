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

import { SlackMessage } from "@atomist/slack-messages";
import { CallbackGoal, EssentialGoalInfo } from "./CallbackGoal";

/**
 * How to present a suggested goal action to the user
 */
export interface ActionSuggestion extends EssentialGoalInfo {

    message: string | SlackMessage;

    /**
     * URL showing further information if available
     */
    url?: string;

    /**
     * Whether to use standard formatting for an action suggestion.
     * Set to false to gain total control.
     */
    format?: boolean;
}

/**
 * Goal that suggests an action to the user.
 */
export class SuggestedActionGoal extends CallbackGoal {

    constructor(suggestion: ActionSuggestion) {
        super({
                ...suggestion as EssentialGoalInfo,
            },
            async gi => {
                let m = suggestion.message;
                /* tslint:disable-next-line */
                if (typeof m === "string" && suggestion.format !== false) {
                    m = ":construction: " + m;
                }
                await gi.addressChannels(m);
                if (!!suggestion.url) {
                    await gi.addressChannels(`For more information, see ${suggestion.url}`);
                }
            });
    }
}
