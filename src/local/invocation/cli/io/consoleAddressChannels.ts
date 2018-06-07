import { AddressChannels } from "../../../../api/context/addressChannels";
import { writeToConsole } from "../support/consoleOutput";

export const ConsoleAddressChannels: AddressChannels =
    async (msg, opts) => {
        return writeToConsole("Message: [%s]", msg);
    };
