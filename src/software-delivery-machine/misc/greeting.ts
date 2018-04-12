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

import * as os from "os";

const greetings = [
    undefined, // default
    "You can do the thing!",
    "hello, rod",
    "not the rug, man",
    "good morning",
    "greetings from atomist",
];

function randomElement(arr: any[]) {
    return arr[getRandomInt(arr.length)];
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

export function greeting() {
    try {
        const host = os.hostname();
        if (host.includes("Rods-MBP")) {
            return randomElement(greetings);
        }
        return undefined;
    } catch (err) {
        return undefined;
    }
}
