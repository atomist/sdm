import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { OnDryRunBuildComplete } from "./support/OnDryRunBuildComplete";

/**
 * Core extension pack to add dry run editing support. It's necessary to add this pack
 * to have dry run editorCommand function respond to builds.
 */
export const DryRunEditing: ExtensionPack = {
    name: "DryRunEditing",
    vendor: "Atomist",
    version: "0.1.0",
    configure: sdm => {
        sdm.addSupportingEvents(
            () => new OnDryRunBuildComplete(sdm.configuration.sdm.repoRefResolver),
        );
    },
};
