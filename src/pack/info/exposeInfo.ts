import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { createRepoHandler } from "./createRepo";
import { listGeneratorsHandler } from "./listGenerators";
import { selfDescribeHandler } from "./SelfDescribe";

/**
 * Expose information about this machine
 */
export const ExposeInfo: ExtensionPack = {
    name: "ExposeInfo",
    vendor: "Atomist",
    version: "0.1.0",
    configure: sdm => {
        sdm.addSupportingCommands(
            selfDescribeHandler(sdm),
            listGeneratorsHandler(sdm),
            createRepoHandler(sdm),
        );
    },
};
