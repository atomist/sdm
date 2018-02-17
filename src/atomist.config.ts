import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";
import { HelloWorld } from "./handlers/commands/HelloWorld";
import { ActOnRepoCreation } from "./handlers/events/repo/ActOnRepoCreation";
import { LocalMavenBuildOnSucessStatus } from "./software-delivery-machine/blueprint/build/LocalMavenBuildOnScanSuccessStatus";
import { OnBuildComplete } from "./software-delivery-machine/blueprint/build/onBuildComplete";
import {
    CloudFoundryProductionDeployOnArtifactStatus,
    CloudFoundryStagingDeployOnArtifactStatus,
} from "./software-delivery-machine/blueprint/deploy/cloudFoundryDeployOnArtifactStatus";
import { DeployToProd } from "./software-delivery-machine/blueprint/deploy/deployToProd";
import { DescribeStagingAndProd } from "./software-delivery-machine/blueprint/deploy/describeRunningServices";
import { NotifyOnDeploy } from "./software-delivery-machine/blueprint/deploy/notifyOnDeploy";
import { OfferPromotion, offerPromotionCommand } from "./software-delivery-machine/blueprint/deploy/offerPromotion";
import { MyFingerprinter } from "./software-delivery-machine/blueprint/fingerprint/calculateFingerprints";
import { SemanticDiffReactor } from "./software-delivery-machine/blueprint/fingerprint/reactToFingerprintDiffs";
import { OnNewRepoWithCode } from "./software-delivery-machine/blueprint/onFirstPush";
import {
    applyHttpServicePhases,
    PhaseCleanup,
    PhaseSetup,
} from "./software-delivery-machine/blueprint/phaseManagement";
import { ReviewOnPush } from "./software-delivery-machine/blueprint/review/reviewOnPush";
import { addCloudFoundryManifest } from "./software-delivery-machine/commands/editors/addCloudFoundryManifest";
import { affirmationEditor } from "./software-delivery-machine/commands/editors/affirmationEditor";
import { breakBuildEditor, unbreakBuildEditor } from "./software-delivery-machine/commands/editors/breakBuild";
import { springBootGenerator } from "./software-delivery-machine/commands/generators/spring/springBootGenerator";
import { VerifyEndpoint } from "./software-delivery-machine/blueprint/verify/verifyEndpoint";

// tslint:disable-next-line:no-var-requires
const pj = require(`${appRoot.path}/package.json`);

const token = process.env.GITHUB_TOKEN;

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    teamIds: ["T5964N9B7"], // <-- run @atomist pwd in your slack team to obtain the team id
    commands: [
        () => springBootGenerator(),
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
        SemanticDiffReactor,
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
