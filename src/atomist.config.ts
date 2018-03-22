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
import { EphemeralLocalArtifactStore } from "./common/artifact/local/EphemeralLocalArtifactStore";
import { CachingProjectLoader } from "./common/repo/CachingProjectLoader";
import { DeployEnablementIngester } from "./ingesters/deployEnablement";
import { cloudFoundrySoftwareDeliveryMachine } from "./software-delivery-machine/machines/cloudFoundrySoftwareDeliveryMachine";
import { staticAnalysisSoftwareDeliveryMachine } from "./software-delivery-machine/machines/staticAnalysisSoftwareDeliveryMachine";

const SdmOptions = {
    artifactStore: new EphemeralLocalArtifactStore(),
    projectLoader: new CachingProjectLoader(),
    useCheckstyle: process.env.USE_CHECKSTYLE === "true",
};

/*
 * The provided software delivery machines include cloud foundry (which runs locally for Test environment,
 * by default, and your PCF for Prod) and kubernetes (which deploys Spring-boot services to an Atomist-provided
 * cluster for Test and Prod). Take your pick.
 */

const machine = cloudFoundrySoftwareDeliveryMachine(SdmOptions);

// const machine = staticAnalysisSoftwareDeliveryMachine(SdmOptions);

// const machine = k8sSoftwareDeliveryMachine(SdmOptions);

export const configuration: Configuration = {
    commands: machine.commandHandlers.concat([]),
    events: machine.eventHandlers.concat([]),
    // TODO CD move ingesters to different global automation
    ingesters: [
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
