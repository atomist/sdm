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

import { HandlerContext, logger } from "@atomist/automation-client";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Destination } from "@atomist/automation-client/spi/message/MessageClient";
import { messageDestinationsFor } from "../../api/context/addressChannels";
import { RunWithLogContext } from "../../api/goal/ExecuteGoalWithLog";
import { PushImpactListenerInvocation } from "../../api/listener/PushImpactListener";
import { filesChangedSince, filesChangedSinceParentCommit } from "../misc/git/filesChangedSince";
import { filteredView } from "../misc/project/filteredView";

/**
 * Create a PushImpactListenerInvocation from the given context.
 * Includes both the complete project and the changed files.
 * @param {RunWithLogContext} rwlc
 * @param {GitProject} project
 * @return {Promise<PushImpactListenerInvocation>}
 */
export async function createPushImpactListenerInvocation(rwlc: RunWithLogContext,
                                                         project: GitProject): Promise<PushImpactListenerInvocation> {
    const {status, credentials, id, context, addressChannels} = rwlc;
    const commit = status.commit;
    const smartContext = teachToRespondInEventHandler(context, ...messageDestinationsFor(commit.repo, context));

    const push = commit.pushes[0];
    const filesChanged = push.before ?
        await filesChangedSince(project, push.before.sha) :
        await filesChangedSinceParentCommit(project);
    const impactedSubProject = !filesChanged ? project : filteredView(project, path => filesChanged.includes(path));
    return {
        id,
        context: smartContext,
        addressChannels,
        project,
        impactedSubProject,
        credentials,
        filesChanged,
        commit,
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
