import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";
import { davosEditor } from "./handlers/commands/editors/user/davosEditor";
import { touchEditor } from "./handlers/commands/editors/user/touchEditor";
import { HelloWorld } from "./handlers/commands/HelloWorld";
import { BuildOnScanSuccessStatus } from "./handlers/events/delivery/BuildOnScanSuccessStatus";
import { CloudFoundryDeployOnArtifactStatus } from "./handlers/events/delivery/deploy/pcf/CloudFoundryDeployOnArtifactStatus";
import { ScanOnPush } from "./handlers/events/delivery/ScanOnPush";
import { ActOnRepoCreation } from "./handlers/events/repo/ActOnRepoCreation";

// tslint:disable-next-line:no-var-requires
const pj = require(`${appRoot.path}/package.json`);

const token = process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamIds: ["T5964N9B7"], // <-- run @atomist pwd in your slack team to obtain the team id
    commands: [
        HelloWorld,
        () => davosEditor,
        () => touchEditor,
    ],
    events: [
        ActOnRepoCreation,
        BuildOnScanSuccessStatus,
        () => CloudFoundryDeployOnArtifactStatus,
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
