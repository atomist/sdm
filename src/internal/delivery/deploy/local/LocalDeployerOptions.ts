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

import { ChildProcess } from "child_process";
import { Deployment } from "../../../../spi/deploy/Deployment";

export interface StartupInfo {

    port: number;

    atomistTeam: string;

    contextRoot: string;
}

export interface SpawnedDeployment extends Deployment {

    childProcess: ChildProcess;
}

export interface LocalDeployerOptions {

    /**
     * url of the host
     */
    baseUrl: string;

    /**
     * Initial port to use
     */
    lowerPort?: number;

    /**
     * Command line arguments for the startup process to
     * expose our port and Atomist team if possible
     * Should be an array as valid input into node spawn
     * @param {StartupInfo} s
     * @return {string[]}
     */
    commandLineArgumentsFor: (s: StartupInfo) => string[];

    /**
     * Pattern to find in output to indicate that the server has come up successfully.
     * For example, matching something like "Started SpringRestSeedApplication in 3.931 seconds"
     */
    successPatterns: RegExp[];
}

export const DefaultLocalDeployerOptions: Partial<LocalDeployerOptions> = {
    lowerPort: 8080,
};
