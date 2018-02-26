import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";
import { HelloWorld } from "./handlers/commands/HelloWorld";
import { MachineAssembler } from "./sdm-support/MachineAssembler";
import { applyHttpServicePhases } from "./software-delivery-machine/blueprint/phase/phaseManagement";
import { affirmationEditor } from "./software-delivery-machine/commands/editors/affirmationEditor";
import { breakBuildEditor, unbreakBuildEditor } from "./software-delivery-machine/commands/editors/breakBuild";
import { springK8sSoftwareDeliveryMachine } from "./software-delivery-machine/springK8sSoftwareDeliveryMachine";
import { springPCFSoftwareDeliveryMachine } from "./software-delivery-machine/springPCFSoftwareDeliveryMachine";

// tslint:disable-next-line:no-var-requires
const pj = require(`${appRoot.path}/package.json`);

const token = process.env.GITHUB_TOKEN;

const assembled = new MachineAssembler(
    springPCFSoftwareDeliveryMachine({useCheckstyle: false}),
    // springK8sSoftwareDeliveryMachine({useCheckstyle: false}),
);

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamIds: [
        //  "T1JVCMVH7",
        "T5964N9B7",
    ], // <-- run @atomist pwd in your slack team to obtain the team id
    commands: assembled.commandHandlers.concat([
        HelloWorld,
        () => affirmationEditor,
        () => applyHttpServicePhases,
        () => breakBuildEditor,
        () => unbreakBuildEditor,
    ]),
    events: assembled.eventHandlers.concat([]),
    token,
    http: {
        enabled: false,
    },
};
