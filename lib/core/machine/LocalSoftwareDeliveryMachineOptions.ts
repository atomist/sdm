/*
 * Copyright © 2020 Atomist, Inc.
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

import { AnyOptions } from "@atomist/automation-client/lib/configuration";
import { SoftwareDeliveryMachineConfiguration } from "../../api/machine/SoftwareDeliveryMachineOptions";

/**
 * Configuration determining how to run in local mode
 */
export interface LocalSoftwareDeliveryMachineOptions {

    /**
     * Base of expanded directory tree the local client will work with:
     * The projects the SDM can operate on. Defaulting rule handled in
     * sdm-local.
     * Under this we find /<org>/<repo>
     */
    repositoryOwnerParentDirectory?: string;

    /**
     * Use local seeds (in whatever git state) vs cloning if possible?
     * Default will be true
     */
    preferLocalSeeds?: boolean;

    /**
     * Whether to merge autofixes automatically
     */
    mergeAutofixes?: boolean;

    /**
     * Whether to merge pull request branches automatically.
     * For instance, if you run a BuildAwareTransform (like Upgrade Spring Boot in the spring seed SDM),
     * it'll make a branch and then run the build on it; when the build passes,
     * the SDM will commit the change into your default branch in your working directory.
     */
    mergePullRequests?: boolean;

    /**
     * Name of host to use for creating local url
     */
    hostname?: string;
}

/**
 * Configuration that takes SoftwareDeliveryMachineOptions inside the sdm key.
 */
export interface LocalSoftwareDeliveryMachineConfiguration extends SoftwareDeliveryMachineConfiguration {
    local: LocalSoftwareDeliveryMachineOptions & AnyOptions;
}
