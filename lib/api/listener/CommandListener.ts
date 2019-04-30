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

import {
    NoParameters,
    RemoteRepoRef,
} from "@atomist/automation-client";
import { ParameterPromptOptions } from "../context/parameterPrompt";
import { ParametersDefinition } from "../registration/ParametersDefinition";
import { SdmListener } from "./Listener";
import { ParametersInvocation } from "./ParametersInvocation";

/**
 * Context for a command
 */
export interface CommandListenerInvocation<PARAMS = NoParameters> extends ParametersInvocation<PARAMS> {

    commandName: string;

    /**
     * The repos this command relates to, if available.
     */
    ids?: RemoteRepoRef[];

    /**
     * Prompt for additional parameters needed during execution of the command listener.
     *
     * Callers should wait for the returned Promise to resolve. It will resolve with the requested
     * parameters if those have already been collected. If not, a parameter prompt request to the backend
     * will be sent and the Promise will reject. Once the new parameters are collected, a new
     * command invocation will be sent and the command listener will restart.
     *
     * This requires that any state that gets created before calling promptFor can be re-created when
     * re-entering the listener function. Also any action taken before calling promptFor needs to be
     * implemented using idempotency patterns.
     */
    promptFor<NEWPARAMS>(parameters: ParametersDefinition<NEWPARAMS>,
                         options?: ParameterPromptOptions): Promise<NEWPARAMS>;

}

export type CommandListener<PARAMS = NoParameters> =
    SdmListener<CommandListenerInvocation<PARAMS>>;
