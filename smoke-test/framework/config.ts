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

import { AxiosRequestConfig } from "axios";
import axios from "axios";

export interface SmokeTestConfig {
    atomistTeamId: string;
    baseEndpoint: string;

    user: string;

    password: string;

    githubOrg: string;
}

export function automationServerAuthHeaders(config: SmokeTestConfig): AxiosRequestConfig {
    return {
        headers: {
            "content-type": "application/json",
            // Authorization: `Bearer ${config.jwt}`,
        },
        auth: {
            username: config.user,
            password: config.password,
        },
    };
}

/*
export async function getBearerToken(config: SmokeTestConfig): Promise<string> {
    // curl -u admin:100dd8e5-a154-4598-b124-879abb89df62 -v localhost:2866/info
    const url = config.baseEndpoint + "/info";
    const res = await axios.get(url, {

    })

}
*/
