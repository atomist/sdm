/*
 * Copyright © 2019 Atomist, Inc.
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
    Maker,
    ProjectPersister,
    RepoFinder,
} from "@atomist/automation-client";
import { ArtifactStore } from "../../spi/artifact/ArtifactStore";
import { CredentialsResolver } from "../../spi/credentials/CredentialsResolver";
import { ProgressLogFactory } from "../../spi/log/ProgressLog";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { RepoRefResolver } from "../../spi/repo-ref/RepoRefResolver";
import { AddressChannels } from "../context/addressChannels";
import { ParameterPromptFactory } from "../context/parameterPrompt";
import { PreferenceStoreFactory } from "../context/preferenceStore";
import { EnrichGoal } from "../goal/enrichGoal";
import { GoalScheduler } from "../goal/support/GoalScheduler";
import { RepoTargets } from "./RepoTargets";
import {
    GoalSigningConfiguration,
    GoalSigningKey,
    GoalVerificationKey,
} from "./SigningKeys";

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
     * Strategy for finding all repos to act on
     */
    repoFinder: RepoFinder;

    /**
     * Strategy for persisting new projects
     */
    projectPersister: ProjectPersister;

    /**
     * Strategy for resolving credentials from a handler invocation
     */
    credentialsResolver: CredentialsResolver;

    /**
     * Allow customization of editor targeting at per-SDM level.
     * If set, can still be overridden by individual editor registrations.
     */
    targets?: Maker<RepoTargets>;

    /**
     * Optional strategy to create a new PreferenceStore implementation
     */
    preferenceStoreFactory?: PreferenceStoreFactory;

    /**
     * Optional strategy to allow prompting for additional parameters
     */
    parameterPromptFactory?: ParameterPromptFactory<any>;

    /**
     * Optional strategy for launching goals in different infrastructure
     */
    goalScheduler?: GoalScheduler | GoalScheduler[];

    /**
     * Optional AddressChannels for communicating with system administrator
     * Defaults to logging a warning unless this is set.
     */
    adminAddressChannels?: AddressChannels;

    /**
     * Callback to enrich goal metadata before it gets persisted and planned
     */
    enrichGoal?: EnrichGoal;

    /**
     * Optional set of keys to sign and verify goals that are produced and received
     * by this SDM.
     */
    goalSigning?: GoalSigningConfiguration;
}


/**
 * Configure a directory where files can be cached.
 * This directory is cleaned on SDM startup; files older than 2 hours are removed.
 */
export interface SdmCacheConfiguration {

    cache: {
        enabled: boolean;
        /**
         * Directory defaults to /opt/data
         */
        path?: string;
    };
}


/**
 * Configuration that takes SoftwareDeliveryMachineOptions inside the sdm key.
 */
export interface SoftwareDeliveryMachineConfiguration<AdditionalConfiguration> extends Configuration {
    sdm: SoftwareDeliveryMachineOptions & AdditionalConfiguration & AnyOptions;
}
