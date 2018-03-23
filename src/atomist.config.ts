
import { Configuration } from "@atomist/automation-client/configuration";
import { EphemeralLocalArtifactStore } from "./common/artifact/local/EphemeralLocalArtifactStore";
import { CachingProjectLoader } from "./common/repo/CachingProjectLoader";
import { DeployEnablementIngester } from "./ingesters/deployEnablement";
import { SdmGoalIngester } from "./ingesters/goal";
import { DefaultArtifactStore } from "./software-delivery-machine/blueprint/artifactStore";
import { artifactVerifyingSoftwareDeliveryMachine } from "./software-delivery-machine/machines/artifactVerifyingSoftwareDeliveryMachine";
import { autofixSoftwareDeliveryMachine } from "./software-delivery-machine/machines/autofixSoftwareDeliveryMachine";
import { cloudFoundrySoftwareDeliveryMachine } from "./software-delivery-machine/machines/cloudFoundrySoftwareDeliveryMachine";
import { staticAnalysisSoftwareDeliveryMachine } from "./software-delivery-machine/machines/staticAnalysisSoftwareDeliveryMachine";

const SdmOptions = {
    artifactStore: DefaultArtifactStore,
    projectLoader: new CachingProjectLoader(),
    useCheckstyle: process.env.USE_CHECKSTYLE === "true",
};

/*
 * The provided software delivery machines include Cloud Foundry (which runs locally for Test environment,
 * by default, and your PCF for Prod) and Kubernetes (which deploys Spring-boot services to an Atomist-provided
 * cluster for Test and Prod).
 * Other machines perform only static analysis or autofixes (e.g. to license files).
 * Take your pick.
 */

const machine = cloudFoundrySoftwareDeliveryMachine(SdmOptions);

// const machine = staticAnalysisSoftwareDeliveryMachine({ useCheckstyle: true});

// const machine = autofixSoftwareDeliveryMachine();

// const machine = artifactVerifyingSoftwareDeliveryMachine();

// const machine = k8sSoftwareDeliveryMachine(SdmOptions);

export const configuration: Configuration = {
    commands: machine.commandHandlers.concat([]),
    events: machine.eventHandlers.concat([]),
    // TODO CD move ingesters to different global automation
    ingesters: [
        SdmGoalIngester,
        DeployEnablementIngester,
    ],
    http: {
        enabled: false,
    },
    applicationEvents: {
        enabled: true,
    },
    logging: {
        level: "info",
        file: {
            enabled: true,
            level: "debug",
            name: "./log/github-sdm.log",
        },
    },
};
