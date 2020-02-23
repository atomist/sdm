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

import {
    GraphClient,
    QueryNoCacheOptions,
} from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as cluster from "cluster";
import * as _ from "lodash";
import { StartupListener } from "../../../../api/listener/StartupListener";
import {
    CreateKubernetesClusterProvider,
    DeleteResourceProvider,
    KubernetesClusterProvider,
    ResourceProviderStateName,
    SetResourceProviderState,
} from "../../../../typings/types";
import { isInLocalMode } from "../../../internal/machine/modes";

/**
 * If the SDM is the cluster master, not running in local mode, and
 * registered with one or more workspaces, ensure that this SDM is
 * available as a KubernetesClusterProvider in those workspaces.
 */
export const providerStartupListener: StartupListener = async context => {
    if (isInLocalMode() || !cluster.isMaster) {
        return;
    }
    const sdm = context.sdm;
    if (!_.get(sdm, "configuration.sdm.k8s.options.registerCluster", false)) {
        return;
    }
    if (!sdm || !sdm.configuration || !sdm.configuration.workspaceIds) {
        logger.debug(`SDM configuration contains no workspace IDs, not creating KubernetesClusterProvider`);
    }
    const name = context.sdm.configuration.name;
    const url = _.get(sdm.configuration, "sdm.kubernetes.provider.url");
    await Promise.all(sdm.configuration.workspaceIds.map(async workspaceId => {
        const graphClient = sdm.configuration.graphql.client.factory.create(workspaceId, sdm.configuration);
        logger.debug(`Checking for KubernetesClusterProvider ${name} in workspace ${workspaceId}`);

        const providers = await graphClient.query<KubernetesClusterProvider.Query, KubernetesClusterProvider.Variables>({
            name: "KubernetesClusterProvider",
            variables: { name },
            options: QueryNoCacheOptions,
        });

        if (providers && providers.KubernetesClusterProvider && providers.KubernetesClusterProvider.length === 1) {
            logger.info(`KubernetesClusterProvider ${name} already exists in ${workspaceId}`);
            const provider = providers.KubernetesClusterProvider[0];
            if (url !== provider.url) {
                logger.info(`Deleting existing KubernetesClusterProvider because url doesn't match`);
                await graphClient.mutate<DeleteResourceProvider.Mutation, DeleteResourceProvider.Variables>({
                    name: "DeleteResourceProvider",
                    variables: {
                        id: provider.id,
                    },
                });
            } else if (!provider.state || provider.state.name !== ResourceProviderStateName.converged) {
                await setProviderState(graphClient, providers.KubernetesClusterProvider[0].id, ResourceProviderStateName.converged);
                return;
            }
        }

        if (providers && providers.KubernetesClusterProvider && providers.KubernetesClusterProvider.length > 1) {
            logger.warn(`More than one KubernetesClusterProvider with the name ${name} exists in ${workspaceId}`);
            return;
        }

        logger.info(`Creating KubernetesClusterProvider ${name} in ${workspaceId}`);
        const result = await graphClient.mutate<CreateKubernetesClusterProvider.Mutation, CreateKubernetesClusterProvider.Variables>({
            name: "CreateKubernetesClusterProvider",
            variables: { name, url },
        });
        await setProviderState(graphClient, result.createKubernetesClusterProvider.id, ResourceProviderStateName.converged);
        return;
    }));
    return;
};

/**
 * Set the state of the resource provider identified by provided id.
 */
async function setProviderState(gc: GraphClient, id: string, state: ResourceProviderStateName, error: string = ""): Promise<void> {
    await gc.mutate<SetResourceProviderState.Mutation, SetResourceProviderState.Variables>({
        name: "SetResourceProviderState",
        variables: {
            id,
            state,
            error,
        },
    });
}
