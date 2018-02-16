import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";
import { HelloWorld } from "./handlers/commands/HelloWorld";
import { StatusApprovalGate } from "./handlers/events/gates/StatusApprovalGate";
import { ActOnRepoCreation } from "./handlers/events/repo/ActOnRepoCreation";
import {
    CloudFoundryProductionDeployOnArtifactStatus,
    CloudFoundryStagingDeployOnArtifactStatus,
} from "./software-delivery-machine/blueprint/cloudFoundryDeployOnArtifactStatus";
import { DeployToProd } from "./software-delivery-machine/blueprint/DeployToProd";
import { DescribeStagingAndProd } from "./software-delivery-machine/blueprint/describeRunningServices";
import { MyFingerprinter } from "./software-delivery-machine/blueprint/fingerprint";
import { LocalMavenBuildOnSucessStatus } from "./software-delivery-machine/blueprint/LocalMavenBuildOnScanSuccessStatus";
import { NotifyOnDeploy } from "./software-delivery-machine/blueprint/notifyOnDeploy";
import { OfferPromotion, offerPromotionCommand } from "./software-delivery-machine/blueprint/offerPromotion";
import { OnBuildComplete } from "./software-delivery-machine/blueprint/onBuildComplete";
import { OnNewRepoWithCode } from "./software-delivery-machine/blueprint/onFirstPush";
import {
    applyHttpServicePhases,
    PhaseCleanup,
    PhaseSetup,
} from "./software-delivery-machine/blueprint/phaseManagement";
import { ReviewOnPush } from "./software-delivery-machine/blueprint/scanOnPush";
import { VerifyEndpoint } from "./software-delivery-machine/blueprint/verifyEndpoint";
import { addCloudFoundryManifest } from "./software-delivery-machine/commands/editors/addCloudFoundryManifest";
import { affirmationEditor } from "./software-delivery-machine/commands/editors/affirmationEditor";
import { breakBuildEditor, unbreakBuildEditor, } from "./software-delivery-machine/commands/editors/breakBuild";

// tslint:disable-next-line:no-var-requires
const pj = require(`${appRoot.path}/package.json`);

const token = process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamIds: ["T5964N9B7"], // <-- run @atomist pwd in your slack team to obtain the team id
    commands: [
        HelloWorld,
        DeployToProd,
        () => affirmationEditor,
        () => addCloudFoundryManifest,
        () => offerPromotionCommand,
        DescribeStagingAndProd,
        () => applyHttpServicePhases,
        () => breakBuildEditor,
        () => unbreakBuildEditor,
    ],
    events: [
        ActOnRepoCreation,
        OnNewRepoWithCode,
        PhaseSetup,
        PhaseCleanup,
        MyFingerprinter,
        ReviewOnPush,
        OnBuildComplete,
        LocalMavenBuildOnSucessStatus,
        CloudFoundryStagingDeployOnArtifactStatus,
        CloudFoundryProductionDeployOnArtifactStatus,
        NotifyOnDeploy,
        VerifyEndpoint,
        OfferPromotion,
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
