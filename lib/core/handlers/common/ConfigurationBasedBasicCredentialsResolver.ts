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

import { configurationValue } from "@atomist/automation-client/lib/configuration";
import { Parameters } from "@atomist/automation-client/lib/decorators";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { ProjectOperationCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { CredentialsResolver } from "../../../spi/credentials/CredentialsResolver";

/**
 * Resolves to single credentials from the configuration
 */
@Parameters()
export class ConfigurationBasedBasicCredentialsResolver implements CredentialsResolver {

    constructor(private readonly paths: { username: string, password: string } = {
        username: "sdm.git.user",
        password: "sdm.git.password",
    }) { }

    public eventHandlerCredentials(context: HandlerContext): ProjectOperationCredentials {
        return this.credentialsFromConfiguration();
    }

    public commandHandlerCredentials(context: HandlerContext, id: RemoteRepoRef): ProjectOperationCredentials {
        return this.credentialsFromConfiguration();
    }

    private credentialsFromConfiguration(): ProjectOperationCredentials & { username: string, password: string} {
        const creds = {
            username: configurationValue<string>(this.paths.username),
            password: configurationValue<string>(this.paths.password),
        };
        if (!creds.username) {
            throw new Error(`Git username missing at '${this.paths.username}'`);
        }
        if (!creds.password) {
            throw new Error(`Git password missing at '${this.paths.password}'`);
        }
        return creds;
    }
}
