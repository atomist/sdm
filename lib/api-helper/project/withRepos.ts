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
    logger,
    RemoteRepoRef,
} from "@atomist/automation-client";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import { SdmContext } from "../../api/context/SdmContext";
import { WithLoadedProject } from "../../spi/project/ProjectLoader";

/**
 * Perform an action on all accessible repos in parallel.
 * This is normally readonly.
 * If you want to perform an update, use a CodeTransform.
 * @param {SoftwareDeliveryMachine} sdm
 * @param {SdmContext} i
 * @param {WithLoadedProject<any>} action
 * @return {Promise<any>}
 */
export async function doWithRepos(sdm: SoftwareDeliveryMachine,
                                  i: SdmContext,
                                  action: WithLoadedProject<any>): Promise<any> {
    const repos = await sdm.configuration.sdm.repoFinder(i.context);
    logger.info("doWithRepos working on %d repos", repos.length);
    await Promise.all(repos.map(id => {
        return sdm.configuration.sdm.projectLoader.doWithProject(
            { credentials: i.credentials, id: id as RemoteRepoRef, readOnly: true },
            action)
            .catch(err => {
                logger.warn("Project err: %s", err);
            });
    }));
}
