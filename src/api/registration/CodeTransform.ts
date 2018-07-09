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

import { HandlerLifecycle } from "@atomist/automation-client/HandlerContext";
import { Source } from "@atomist/automation-client/internal/transport/RequestProcessor";
import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { Project } from "@atomist/automation-client/project/Project";
import { GraphClient } from "@atomist/automation-client/spi/graph/GraphClient";
import { MessageClient, SlackMessageClient } from "@atomist/automation-client/spi/message/MessageClient";
import { CommandListenerInvocation } from "../listener/CommandListener";

/**
 * This interface contains methods from HandlerContext.
 * They are duplicated here so that they can be individually deprecated.
 * @deprecated Use CommandListenerInvocation
 */
export interface HandlerContextMethods {

    /**
     * @deprecated use context.teamId
     */
    teamId: string;

    /**
     * @deprecated use context.teamId
     */
    correlationId: string;

    /**
     * @deprecated use context.teamId
     */
    invocationId?: string;

    /**
     * @deprecated use context.source
     */
    source?: Source;

    /**
     * @deprecated use context.graphClient
     */
    graphClient?: GraphClient;

    /**
     * @deprecated use context.messageClient
     */
    messageClient: MessageClient & SlackMessageClient;

    /**
     * @deprecated use context.lifecycle
     */
    lifecycle?: HandlerLifecycle;
}

/**
 * Function that can transform a project. Mixing HandlerContextMethods into second
 * parameter, and third parameter are only for backward compatibility.
 * New code should use (Project, Command ListenerInvocation).
 */
export type CodeTransform<P = any> = (p: Project,
                                      sdmc: CommandListenerInvocation & HandlerContextMethods,
                                      params?: P) => Promise<Project | EditResult>;

/**
 * One or many CodeTransforms
 */
export type CodeTransformOrTransforms<PARAMS> = CodeTransform<PARAMS> | Array<CodeTransform<PARAMS>>;
