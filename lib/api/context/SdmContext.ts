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
    HandlerContext,
    ProjectOperationCredentials,
    RemoteRepoRef,
} from "@atomist/automation-client";
import { AddressChannels } from "./addressChannels";

/**
 * Context for an SDM action, whether a listener invocation or internal action
 */
export interface SdmContext {

    /**
     * Context of the Atomist EventHandler invocation. Use to run GraphQL
     * queries, use the messageClient directly and find
     * the team and correlation id
     */
    context: HandlerContext;

    /**
     * Provides a way to address the channel(s) related to this action:
     * usually, an event or command invocation.
     * In an event handler, these are usually the channel(s) linked to a repo.
     * In a command handler, the behavior will be the same as that of `MessageClient.respond`.
     * In some cases, such as repo creation or a push to a repo where there is no linked channel,
     * addressChannels will go to dev/null without error.
     */
    addressChannels: AddressChannels;

    /**
     * Credentials for use with source control hosts such as GitHub
     */
    credentials: ProjectOperationCredentials;

}

/**
 * Context for an SDM action on a particular repo
 */
export interface RepoContext extends SdmContext {

    /**
     * The repo this relates to
     */
    id: RemoteRepoRef;

}
