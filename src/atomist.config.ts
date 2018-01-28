
import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";
import { davosEditor } from "./handlers/commands/editors/user/davosEditor";
import { HelloWorld } from "./handlers/commands/HelloWorld";
import { ScanOnPush } from "./handlers/events/code/ScanOnPush";
import { ActOnRepoCreation } from "./handlers/events/repo/ActOnRepoCreation";

// tslint:disable-next-line:no-var-requires
const pj = require(`${appRoot.path}/package.json`);

const token = process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamIds: [ "T5964N9B7"], // <-- run @atomist pwd in your slack team to obtain the team id
    commands: [
        HelloWorld,
        () => davosEditor,
    ],
    events: [
        ActOnRepoCreation,
        ScanOnPush,
    ],
    token,
    http: {
        enabled: true,
        auth: {
            basic: {
                enabled: false,
            },
            bearer: {
                enabled: false,
            },
        },
    },
};
