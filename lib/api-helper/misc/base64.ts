/*
 * Copyright © 2021 Atomist, Inc.
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

/**
 * Base 64 encode the given string
 * @param {string} str
 * @return {string}
 */
export function encode(str: string): string {
    return Buffer.from(str, "utf8").toString("base64");
}

/**
 * Decode the given Base 64 string
 * @param {string} coded
 * @return {string}
 */
export function decode(coded: string): string {
    return Buffer.from(coded, "base64").toString("utf8");
}
