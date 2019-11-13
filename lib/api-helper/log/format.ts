/*
 * Copyright © 2019 Atomist, Inc.
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

import { sprintf } from "sprintf-js";

/**
 * Returns a formatted string replacing any placeholders in msg with
 * provided args
 *
 * See npm springf-js for more details on what args and placeholder
 * patterns are supported.
 */
export function format(msg: string, ...args: any[]): string {
    if (!args || args.length === 0) {
        return msg;
    } else {
        try {
            return sprintf(msg, ...args);
        } catch (e) {
            return msg;
        }
    }
}
