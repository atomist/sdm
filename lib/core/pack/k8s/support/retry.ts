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
    doWithRetry,
    RetryOptions,
} from "@atomist/automation-client/lib/util/retry";
import { errMsg } from "./error";

/**
 * Extract Kubernetes errors for doWithRetry.
 */
export async function logRetry<T>(f: () => Promise<T>, desc: string, options?: RetryOptions): Promise<T> {
    return doWithRetry(async () => {
        let r: T;
        try {
            r = await f();
        } catch (e) {
            if (!(e instanceof Error)) {
                const err = new Error(errMsg(e));
                Object.keys(e).forEach(k => (err as any)[k] = e[k]);
                throw err;
            }
            throw e;
        }
        return r;
    }, desc, options);
}
