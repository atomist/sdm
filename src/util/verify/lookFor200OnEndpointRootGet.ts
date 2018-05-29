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

import { logger } from "@atomist/automation-client";
import { doWithRetry } from "@atomist/automation-client/util/retry";
import axios from "axios";
import * as https from "https";
import { WrapOptions } from "retry";
import { EndpointVerificationInvocation, EndpointVerificationListener } from "../../api/listener/EndpointVerificationListener";

/**
 * Make an HTTP request to the reported endpoint to check
 */
export function lookFor200OnEndpointRootGet(retryOpts: Partial<WrapOptions> = {}): EndpointVerificationListener {
    return (inv: EndpointVerificationInvocation) => {
        const agent = new https.Agent({
            rejectUnauthorized: false,
        });
        if (!inv.url) {
           throw new Error("Verify called with null URL");
        }
        return doWithRetry(
            () => axios.get(inv.url, {httpsAgent: agent})
                .then(resp => {
                    logger.debug(`lookFor200OnEndpointRootGet: Response for ${inv.url} was ${resp.status}`);
                    if (resp.status !== 200) {
                        return Promise.reject(`Unexpected response: ${resp.status}`);
                    }
                    return Promise.resolve();
                }),
            `Try to connect to ${inv.url}`,
            retryOpts);
        // Let a failure go through
    };
}
