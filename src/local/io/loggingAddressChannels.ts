
import { logger } from "@atomist/automation-client";
import { AddressChannels } from "../../api/context/addressChannels";

export const LoggingAddressChannels: AddressChannels =
    async (msg, opts) => {
        return logger.info("Message: [%s]", msg);
    };
