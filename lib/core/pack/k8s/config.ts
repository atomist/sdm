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

import { ProjectOperationCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import * as _ from "lodash";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";

/**
 * Configuration options to be passed to the extension pack creation.
 */
export interface SdmPackK8sOptions {
    /**
     * Whether to add the bot/web-app commands provided by this SDM
     * extension pack.  If no value is provided, the commands are not
     * added.
     */
    addCommands?: boolean;

    /**
     * Whether to register and converge a k8s cluster.  Typically this
     * is used from k8s-sdm to manage k8s cluster it is running in.
     */
    registerCluster?: boolean;

    /**
     * Synchronize resources in k8s cluster with a Git repo.
     */
    sync?: KubernetesSyncOptions;
}

/**
 * Configuration options for sync mode operation.
 */
export interface KubernetesSyncOptions {
    /**
     * To synchronize resources in k8s cluster with a Git repo,
     * provide a repo ref as the value of this property.  The value
     * can be either a SyncRepoRef or RemoteRepoRef.  On startup, the
     * contents of this repo ref will be synchronized with the
     * cluster, subsequent changes to this repo will be syncronized to
     * the cluster, and subsequent resource deployments will update
     * the contents of this repo.
     *
     * If a SyncRepoRef is provided, on startup cortex is queried to
     * find the details of the repo needed to create a RemoteRepoRef.
     * This RemoteRepoRef is created and then used as the value of
     * this property for the lifetime of the SDM.
     *
     * If a RemoteRepoRef is provided, it is used as is.
     */
    repo: SyncRepoRef | RemoteRepoRef;
    /**
     * Credentials to use when cloning the sync.repo.  These are
     * typically not provided in the SDM configuration, rather they
     * are are obtained during startup by the SDM via a cortex query.
     * If they are provided, the provided credentials are used rather
     * than any returned from cortex.
     */
    credentials?: ProjectOperationCredentials;
    /**
     * If provided, the SDM will apply all specs in the sync repo
     * approximately every `intervalMinutes` minutes.  If not provided
     * or set to zero (0) or a negative number, specs will only be
     * applied at startup or when they are changed by a commit.
     */
    intervalMinutes?: number;
    /**
     * Key to use to encrypt Kubernetes Secret resource values before
     * storing them in the sync repo and decrypt them when reading
     * them from the sync repo.  If it is not provided, secrets are
     * not encrypted in the sync repo, so hopefully they aren't too
     * secret.
     *
     * You can use the Atomist CLI or bin/secret.js script bundled
     * with this package to manually encrypt and decrypt values using
     * the same strategy.
     */
    secretKey?: string;
    /**
     * Default format to use when creating Kubernetes specs in the
     * sync repo.  If updating an existing file, the format of the
     * existing file will be used.  If not provided, "yaml" is the
     * default.
     */
    specFormat?: "json" | "yaml";
}

/**
 * Information needed to create a proper RemoteRepoRef for the
 * [[SdmPackK8sOptions.sync.repo]] by querying cortex.
 */
export interface SyncRepoRef {
    /** Owner, i.e., user or organization, of sync repo. */
    owner: string;
    /** Name of sync repository. */
    repo: string;
    /**
     * If branch is provided, it is used.  If it is not provided,
     * things get complicated.  If the repo exists in the graph and it
     * has the defaultBranch property set, then the defaultBranch is
     * used.  If the repo does not exist in the graph or its
     * defaultBranch property is not set, "master" is used.  Since the
     * repo defaultBranch property could not be set initially but get
     * set at a later time, how sync repo behaves can change even if
     * the configuration does not.  Long story short, even though
     * branch is optional, set it if you want sync repo to behave
     * deterministically.
     */
    branch?: string;
    /**
     * The internal cortex ID of the source code management (SCM)
     * provider for the sync repo.  Typically this is not necessary
     * and not provided.  It is only necessary to provide the provider
     * ID if your Atomist workspace has multiple SCM providers and the
     * name and owner of the sync repo you want to use matches
     * different repositories in different SCM providers.  For
     * example, if you want to use "my/specs" as your sync repo and
     * your Atomist workspace is linked to both GitHub.com and a GHE
     * instance, both of which have a repo named "my/specs".
     */
    providerId?: string;
}

/** Validate the the partial SyncOptions contains a repo property. */
export function validSyncOptions(o: Partial<KubernetesSyncOptions>): o is KubernetesSyncOptions {
    return !!o && !!o.repo;
}

/**
 * Safely merge the the provided Kubernetes options with those already
 * existing in the SDM.  The values in the SDM take precedence over
 * those in the passed in options.  The passed in SDM is modified in
 * place and returned.
 *
 * @param sdm Software Delivery Machine that may or may not have any Kubernetes pack options
 * @param options Kubernetes pack options
 * @return Modified SDM object
 */
export function mergeK8sOptions(sdm: SoftwareDeliveryMachine, options?: SdmPackK8sOptions): SoftwareDeliveryMachine {
    _.defaultsDeep(sdm, { configuration: { sdm: { k8s: { options: {} } } } });
    sdm.configuration.sdm.k8s.options = _.merge({}, options, sdm.configuration.sdm.k8s.options);
    return sdm;
}
