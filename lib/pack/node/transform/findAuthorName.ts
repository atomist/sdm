/*
 * Copyright © 2020 Atomist, Inc.
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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { PersonByChatId } from "../../../typings/types";

/**
 * Find the author name from the given screen name, which
 * comes in as a mapped parameter
 * @param {HandlerContext} ctx
 * @param {string} screenName
 * @return {Promise<string>}
 */
export async function findAuthorName(ctx: HandlerContext, screenName: string): Promise<string> {
    try {
        const personResult: PersonByChatId.Query = await ctx.graphClient.query({
            name: "PersonQuery",
            variables: { screenName },
        });
        if (
            !personResult ||
            !personResult.ChatId ||
            personResult.ChatId.length === 0 ||
            !personResult.ChatId[0].person
        ) {
            logger.info("No person; defaulting author to screenName");
            return screenName;
        }
        const person = personResult.ChatId[0].person;
        if (person.forename && person.surname) {
            return `${person.forename} ${person.surname}`;
        }
        if (person.gitHubId) {
            return person.gitHubId.login;
        }
        if (person.emails.length > 0) {
            return person.emails[0].address;
        }
    } catch (err) {
        logger.info(" defaulting author to screenName");
    }
    return screenName;
}
