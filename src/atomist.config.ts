import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";
import { ComposedFunctionalUnit } from "./blueprint/ComposedFunctionalUnit";
import { HelloWorld } from "./handlers/commands/HelloWorld";
import { applyHttpServicePhases } from "./software-delivery-machine/blueprint/phase/jvmPhaseManagement";
import { cloudFoundrySoftwareDeliveryMachine } from "./software-delivery-machine/cloudFoundrySoftwareDeliveryMachine";
import { affirmationEditor } from "./software-delivery-machine/commands/editors/affirmationEditor";
import { breakBuildEditor, unbreakBuildEditor } from "./software-delivery-machine/commands/editors/breakBuild";
import {
    javaAffirmationEditor,
    javaBranchAffirmationEditor,
} from "./software-delivery-machine/commands/editors/javaAffirmationEditor";
import { k8sSoftwareDeliveryMachine } from "./software-delivery-machine/k8sSoftwareDeliveryMachine";

// tslint:disable-next-line:no-var-requires
const pj = require(`${appRoot.path}/package.json`);

const token = process.env.GITHUB_TOKEN;

const assembled = new ComposedFunctionalUnit(
       cloudFoundrySoftwareDeliveryMachine({useCheckstyle: false}),
      // k8sSoftwareDeliveryMachine({useCheckstyle: false}),
);

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamIds: [
         // "T1JVCMVH7",
       "T5964N9B7",    // spring-team
        //  "T29E48P34",    // Atomist community
    ], // <-- run @atomist pwd in your slack team to obtain the team id
    commands: assembled.commandHandlers.concat([
        HelloWorld,
        () => affirmationEditor,
        () => applyHttpServicePhases,
        () => breakBuildEditor,
        () => unbreakBuildEditor,
        () => javaAffirmationEditor,
        () => javaBranchAffirmationEditor,
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
