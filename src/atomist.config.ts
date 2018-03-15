import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";
import { ComposedFunctionalUnit } from "./blueprint/ComposedFunctionalUnit";
import { cloudFoundrySoftwareDeliveryMachine } from "./software-delivery-machine/cloudFoundrySoftwareDeliveryMachine";
import {
    affirmationEditor,
    branchAffirmationEditor,
} from "./software-delivery-machine/commands/editors/demo/affirmationEditor";
import { breakBuildEditor, unbreakBuildEditor } from "./software-delivery-machine/commands/editors/demo/breakBuild";
import {
    javaAffirmationEditor,
    javaBranchAffirmationEditor,
} from "./software-delivery-machine/commands/editors/demo/javaAffirmationEditor";
import { removeFileEditor } from "./software-delivery-machine/commands/editors/helper/removeFile";

// tslint:disable-next-line:no-var-requires
const pj = require(`${appRoot.path}/package.json`);

const token = process.env.GITHUB_TOKEN;

const assembled = new ComposedFunctionalUnit(
      cloudFoundrySoftwareDeliveryMachine({ useCheckstyle: process.env.USE_CHECKSTYLE === "true" }),
      // k8sSoftwareDeliveryMachine({ useCheckstyle: process.env.USE_CHECKSTYLE === "true" }),
);

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    // <-- obtain the ID from the settings page of your Atomist workspace at https://app.atomist.com,
    // then set your env variable
    teamIds: [
         process.env.ATOMIST_WORKSPACE,
    ],
    commands: assembled.commandHandlers.concat([
        () => affirmationEditor,
        () => branchAffirmationEditor,
        () => breakBuildEditor,
        () => unbreakBuildEditor,
        () => javaAffirmationEditor,
        () => javaBranchAffirmationEditor,
        () => removeFileEditor,
    ]),
    events: assembled.eventHandlers.concat([]),
    token,
    http: {
        enabled: false,
    },
    applicationEvents: {
        enabled: true,
    },
};
