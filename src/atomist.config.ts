/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Configuration } from "@atomist/automation-client/configuration";
import { SoftwareDeliveryMachineOptions } from "./blueprint/SoftwareDeliveryMachine";
import { EphemeralLocalArtifactStore } from "./common/artifact/local/EphemeralLocalArtifactStore";
import { CachingProjectLoader } from "./common/repo/CachingProjectLoader";
import { DeployEnablementIngester } from "./ingesters/deployEnablement";
import { SdmGoalIngester } from "./ingesters/sdmGoalIngester";
import { DefaultArtifactStore } from "./software-delivery-machine/blueprint/artifactStore";
import { artifactVerifyingSoftwareDeliveryMachine } from "./software-delivery-machine/machines/artifactVerifyingMachine";
import { autofixSoftwareDeliveryMachine } from "./software-delivery-machine/machines/autofixMachine";
import { cloudFoundrySoftwareDeliveryMachine } from "./software-delivery-machine/machines/cloudFoundryMachine";
import { k8sSoftwareDeliveryMachine } from "./software-delivery-machine/machines/k8sMachine";
import { projectCreationMachine } from "./software-delivery-machine/machines/projectCreationMachine";
import { staticAnalysisSoftwareDeliveryMachine } from "./software-delivery-machine/machines/staticAnalysisMachine";
import { JavaSupportOptions } from "./software-delivery-machine/parts/stacks/javaSupport";

const notLocal = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging";

const SdmOptions: SoftwareDeliveryMachineOptions & JavaSupportOptions = {
    artifactStore: DefaultArtifactStore,
    projectLoader: new CachingProjectLoader(),
    useCheckstyle: process.env.USE_CHECKSTYLE === "true",
    reviewOnlyChangedFiles: true,
};

/*
 * The provided software delivery machines include Cloud Foundry (which runs locally for Test environment,
 * by default, and your PCF for Prod) and Kubernetes (which deploys Spring-boot services to an Atomist-provided
 * cluster for Test and Prod).
 * Other machines perform only static analysis or autofixes (e.g. to license files).
 * Take your pick.
 */

const machine = cloudFoundrySoftwareDeliveryMachine(SdmOptions);

// const machine = projectCreationMachine(SdmOptions);

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
        enabled: true,
        auth: {
            basic: {
                enabled: true,
                username: "admin",
                password: "447b8bce-eeea-42ff-bf9a-c8368f70c9c7",
            },
        },
    },
    applicationEvents: {
        enabled: true,
    },
    cluster: {
        enabled: notLocal,
        // worker: 2,
    },
    ws: {
        enabled: true,
        termination: {
            graceful: notLocal,
        },
    },
    logging: {
        level: "info",
        file: {
            enabled: !notLocal,
            level: "debug",
            name: "./log/github-sdm.log",
        },
    },
};
