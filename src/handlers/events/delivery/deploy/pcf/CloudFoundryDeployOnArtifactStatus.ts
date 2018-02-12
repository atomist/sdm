/*
 * Copyright © 2017 Atomist, Inc.
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

import { ArtifactCheckout, DeployableArtifact, DeployOnArtifactStatus } from "../../DeployOnArtifactStatus";
import { CommandLineCloudFoundryDeployer } from "./CommandLineCloudFoundryDeployer";
import { CloudFoundryInfo, EnvironmentCloudFoundryTarget, PivotalWebServices } from "./CloudFoundryTarget";

/**
 *
 * @param {string} targetUrl
 * @return {string} the directory
 */
const localCheckout: ArtifactCheckout = targetUrl => {
    //Form is http:///var/folders/86/p817yp991bdddrqr_bdf20gh0000gp/T/tmp-20964EBUrRVIZ077a/target/losgatos1-0.1.0-SNAPSHOT.jar
    const lastSlash = targetUrl.lastIndexOf("/");
    const filename = targetUrl.substr(lastSlash + 1);
    const name = filename.substr(0, filename.indexOf("-"));
    const version = filename.substr(name.length + 1);
    const cwd = targetUrl.substring(7, lastSlash);
    const local: DeployableArtifact = {
        name,
        version,
        cwd,
        filename,
    };
    return Promise.resolve(local);
};

/**
 * Deploy everything to the same Cloud Foundry space
 * @type {DeployOnArtifactStatus<CloudFoundryInfo>}
 */
export const CloudFoundryDeployOnArtifactStatus =
    new DeployOnArtifactStatus(localCheckout,
        new CommandLineCloudFoundryDeployer(),
        () => new EnvironmentCloudFoundryTarget());
