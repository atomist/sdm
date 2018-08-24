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

import * as base64 from "base64-js";

/**
 * Base 64 encode the given string
 * @param {string} str
 * @return {string}
 */
export function encode(str: string): string {
    const arr: number[] = [];
    for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i));
    }
    return base64.fromByteArray(arr);
}

/**
 * Decode the given Base 64 string
 * @param {string} coded
 * @return {string}
 */
export function decode(coded: string): string {
    const decoded = base64.toByteArray(coded);
    return String.fromCharCode.apply(null, decoded);
}
