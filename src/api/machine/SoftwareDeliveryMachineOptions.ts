/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    AnyOptions,
    Configuration,
} from "@atomist/automation-client/configuration";
import { ArtifactStore } from "../../spi/artifact/ArtifactStore";
import { CredentialsResolver } from "../../spi/credentials/CredentialsResolver";
import { ProgressLogFactory } from "../../spi/log/ProgressLog";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { RepoRefResolver } from "../../spi/repo-ref/RepoRefResolver";

/**
 * Infrastructure options common to all SoftwareDeliveryMachines.
 * Can be used to control the behavior of an SDM, and
 * also to facilitate testing.
 */
export interface SoftwareDeliveryMachineOptions {

    /**
     * Store for artifacts produced during the build process
     */
    artifactStore: ArtifactStore;

    /**
     * Object used to load projects
     */
    projectLoader: ProjectLoader;

    /**
     * Factory for loggers used to log specific activities
     * such as build and deployment.
     */
    logFactory: ProgressLogFactory;

    /**
     * Strategy for resolving Git repository references
     */
    repoRefResolver: RepoRefResolver;

    /**
     * Strategy for resolving credentials from a handler invocation
     */
    credentialsResolver: CredentialsResolver;

}

/**
 * Configuration that takes SoftwareDeliveryMachineOptions inside the sdm key.
 */
export interface SoftwareDeliveryMachineConfiguration extends Configuration {
    sdm: SoftwareDeliveryMachineOptions & AnyOptions;
}
