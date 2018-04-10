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

import { logger } from "@atomist/automation-client";
import { CloudFoundryInfo, PivotalWebServices } from "./CloudFoundryTarget";

/**
 * Configure cloud foundry from environment variables.
 * See README for definition.
 */
export class EnvironmentCloudFoundryTarget implements CloudFoundryInfo {

    public api = process.env.PCF_API || PivotalWebServices.api;

    public username = process.env.PIVOTAL_USER;

    public password = process.env.PIVOTAL_PASSWORD;

    public org = process.env.PCF_ORG;

    /**
     * Logical name for the space
     * @param {string} environmentName: Name of the environment, such as "staging" or "production"
     */
    constructor(private readonly environmentName: "staging" | "production") {
    }

    get space() {
        const envKey = "PCF_SPACE_" + this.environmentName.toUpperCase();
        const space = process.env[envKey];
        logger.info("PCF space for environment [%s] is [%s]", this.environmentName, space);
        if (!space) {
            throw new Error(`Please set environment key ${envKey} to deploy to Cloud Foundry environment ${this.environmentName}`);
        }
        return space;
    }

    get name() {
        return `PCF: ${this.environmentName}`;
    }

    get description() {
        return `PCF ${this.api};org=${this.org};space=${this.space};user=${this.username}`;
    }
}
