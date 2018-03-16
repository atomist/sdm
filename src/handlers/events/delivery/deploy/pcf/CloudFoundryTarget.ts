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

import { TargetInfo } from "../../../../../spi/deploy/Deployment";


export const PCFTestingDomain = "ri-staging";
export const PCFProductionDomain = "ri-production";

/**
 * Path to Cloud Foundry manifest within deployable projects
 * @type {string}
 */
export const CloudFoundryManifestPath = "manifest.yml";

export interface CloudFoundryInfo extends TargetInfo {

    api: string;
    username: string;
    password: string;
    space: string;
    org: string;

}

export const PivotalWebServices = { // : Partial<CloudFoundryInfo> = {

    api: "https://api.run.pivotal.io",
};

export class EnvironmentCloudFoundryTarget implements CloudFoundryInfo {

    public api = process.env.PCF_API || PivotalWebServices.api;

    public username = process.env.PIVOTAL_USER;

    public password = process.env.PIVOTAL_PASSWORD;

    public space = process.env.PCF_SPACE || PCFProductionDomain;

    public org = process.env.PCF_ORG;

    get name() {
        return `PCF`;
    }

    get description() {
        return `PCF ${this.api};org=${this.org};space=${this.space};user=${this.username}`;
    }
}
