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

import { AddressNoChannels } from "../../api/context/addressChannels";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import { fakeContext } from "./fakeContext";

export function fakeCommandListenerInvocation<P>(opts: Partial<CommandListenerInvocation<P>> = {}): CommandListenerInvocation {
    return {
        commandName: opts.commandName || "test",
        parameters: opts.parameters,
        context: fakeContext(),
        addressChannels: AddressNoChannels,
        credentials: opts.credentials,
        ...opts,
    };
}
