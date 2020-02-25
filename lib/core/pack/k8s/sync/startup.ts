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

import { logger } from "@atomist/automation-client/lib/util/logger";
import * as cluster from "cluster";
import * as _ from "lodash";
import { createJob } from "../../../../api-helper/misc/job/createJob";
import { fakeContext } from "../../../../api-helper/testsupport/fakeContext";
import { StartupListener } from "../../../../api/listener/StartupListener";
import { SoftwareDeliveryMachine } from "../../../../api/machine/SoftwareDeliveryMachine";
import { isInLocalMode } from "../../../machine/modes";
import { queryForScmProvider } from "./repo";
import { KubernetesSync } from "./sync";

/**
 * If the SDM is registered with one or more workspaces and not
 * running in local mode, query cortex for the sync repo and replace
 * the sdm.k8s.options.sync.repo property with a RemoteRepoRef for
 * that repo.  If this is the cluster master, it will create a job to
 * perform a sync.  If this is the cluster master and the SDM
 * configuration has a [[KubernetesSyncOptions]] with a positive value
 * of `intervalMinutes`, it will set up an interval timer to apply the
 * specs from the sync repo periodically.
 */
export const syncRepoStartupListener: StartupListener = async ctx => {
    if (isInLocalMode()) {
        return;
    }
    const sdm = ctx.sdm;
    if (!await queryForScmProvider(sdm)) {
        return;
    }
    if (!cluster.isMaster) {
        return;
    }
    await sdmRepoSync(sdm);
    const interval: number = _.get(sdm, "configuration.sdm.k8s.options.sync.intervalMinutes");
    if (interval && interval > 0) {
        logger.info(`Creating sync repo trigger every ${interval} minutes`);
        setInterval(() => sdmRepoSync(sdm), interval * 60 * 1000);
    }
    return;
};

/**
 * Create the trappings required for executing a command and then
 * create a job to execute the [[kubernetesSync]] command.
 */
async function sdmRepoSync(sdm: SoftwareDeliveryMachine): Promise<void> {
    const workspaceId = sdm.configuration.workspaceIds[0];
    const context = fakeContext(workspaceId);
    context.graphClient = sdm.configuration.graphql.client.factory.create(workspaceId, sdm.configuration);
    logger.info("Creating sync repo job");
    await createJob({ command: KubernetesSync, parameters: [{}] }, context);
    return;
}
