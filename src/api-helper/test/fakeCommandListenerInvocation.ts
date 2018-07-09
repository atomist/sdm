import { AddressNoChannels } from "../../api/context/addressChannels";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import { fakeContext } from "./fakeContext";

export function fakeCommandListenerInvocation<P>(opts: Partial<CommandListenerInvocation> = {}): CommandListenerInvocation {
    return {
        commandName: opts.commandName || "test",
        parameters: opts.parameters,
        context: fakeContext(),
        addressChannels: AddressNoChannels,
        credentials: opts.credentials,
        ...opts,
    };
}
