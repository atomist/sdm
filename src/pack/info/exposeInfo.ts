import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { createRepoHandler } from "./createRepo";
import { listGeneratorsHandler } from "./listGenerators";
import { selfDescribeHandler } from "./SelfDescribe";

/**
 * Expose information about this machine
 * @type {{name: string; configure: (sdm) => void}}
 */
export const ExposeInfo: ExtensionPack = {

    name: "ExposeInfo",

    configure: sdm => {
        sdm.addSupportingCommands(
            selfDescribeHandler(sdm),
            listGeneratorsHandler(sdm),
            createRepoHandler(sdm),
        );
    },
};
