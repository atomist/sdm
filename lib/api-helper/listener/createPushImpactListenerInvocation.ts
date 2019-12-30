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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { Destination } from "@atomist/automation-client/lib/spi/message/MessageClient";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { messageDestinationsFor } from "../../api/context/addressChannels";
import { GoalInvocation } from "../../api/goal/GoalInvocation";
import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";
import { filesChangedSince } from "../misc/git/filesChangedSince";
import { filteredView } from "../misc/project/filteredView";

/**
 * Create a PushImpactListenerInvocation from the given context.
 * Includes both the complete project and the changed files.
 * @param {GoalInvocation} goalInvocation
 * @param {GitProject} project
 * @return {Promise<PushImpactListenerInvocation>}
 */
export async function createPushImpactListenerInvocation(goalInvocation: GoalInvocation,
                                                         project: GitProject): Promise<PushImpactListenerInvocation> {
    const { goalEvent, credentials, id, context, addressChannels, preferences, configuration } = goalInvocation;
    const smartContext = teachToRespondInEventHandler(context, ...messageDestinationsFor(goalEvent.push.repo, context));

    const push = goalEvent.push;
    const filesChanged = await filesChangedSince(project, push);
    const impactedSubProject = !filesChanged ? project : filteredView(project, path => filesChanged.includes(path));
    return {
        id,
        context: smartContext,
        configuration,
        addressChannels,
        preferences,
        project,
        impactedSubProject,
        credentials,
        filesChanged,
        commit: goalEvent.push.after,
        push,
    };
}

/**
 * Safely mutate the given HandlerContext so that it can respond even when used in
 * an EventHandler
 * @param ctx context to wrap
 * @param destinations
 * @return {HandlerContext}
 */
function teachToRespondInEventHandler(ctx: HandlerContext, ...destinations: Destination[]): HandlerContext {
    const oldRespondMethod = ctx.messageClient.respond;
    ctx.messageClient.respond = async (msg, options) => {
        // First try routing to response. If that doesn't work, we're probably
        // in an event handler. Try linked channels.
        try {
            return await oldRespondMethod(msg, options);
        } catch (err) {
            logger.debug("Rerouting response message to destinations: message was [%s]", msg);
            return ctx.messageClient.send(msg, destinations, options);
        }
    };
    return ctx;
}
