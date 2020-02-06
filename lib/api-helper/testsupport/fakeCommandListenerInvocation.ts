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

import { AddressNoChannels } from "../../api/context/addressChannels";
import { NoParameterPrompt } from "../../api/context/parameterPrompt";
import { NoPreferenceStore } from "../../api/context/preferenceStore";
import { createSkillContext } from "../../api/context/skillContext";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import { fakeContext } from "./fakeContext";

export function fakeCommandListenerInvocation<P>(opts: Partial<CommandListenerInvocation<P>> = {}): CommandListenerInvocation<P> {
    return {
        commandName: opts.commandName || "test",
        parameters: opts.parameters,
        context: fakeContext(),
        configuration: {},
        addressChannels: AddressNoChannels,
        promptFor: NoParameterPrompt,
        preferences: NoPreferenceStore,
        credentials: opts.credentials,
        ...opts,
        skill: createSkillContext(fakeContext()),
    };
}
