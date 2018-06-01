import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { CreateRepoHandler } from "./createRepo";
import { ListGeneratorsHandler } from "./listGenerators";
import { SelfDescribeHandler } from "./SelfDescribe";

/**
 * Expose information about this machine
 */
export const ExposeInfo: ExtensionPack = {
    name: "ExposeInfo",
    vendor: "Atomist",
    version: "0.1.0",
    configure: sdm => {
        sdm.addCommands(
            SelfDescribeHandler,
            ListGeneratorsHandler,
            CreateRepoHandler,
        );
    },
};
