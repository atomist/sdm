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

import * as stringify from "json-stringify-safe";

/**
 * If removing invalid characters from the name results in an empty
 * string, this value is used as the name.  You do not want more than
 * one application per namespace to end up using this.
 */
export const defaultValidName = "valid-name";

/**
 * Ensure the provided name is a valid Kubernetes resouce name.  The
 * validation regular expression for a resource is
 * `/^[a-z]([-a-z0-9]*[a-z0-9])?$/` and it must be between 1 and 63
 * characters long.
 *
 * @param name The resource name
 * @return A valid resource name based on the input
 */
export function validName(name: string): string {
    const valid = name.slice(0, 63).toLocaleLowerCase()
        .replace(/^[^a-z]+/, "")
        .replace(/[^a-z0-9]+$/, "")
        .replace(/[^-a-z0-9]+/g, "-");
    return (valid) ? valid : defaultValidName;
}

/**
 * Determine if the `value` matches the `matcher`.
 * The matching rules are as follows:
 *
 * -   If the `matcher` is a string, `value` and `matcher` must be equal (===).
 * -   If `matcher` is a regular expression, `value` must match the regular expression according to RegExp.test().
 * -   If no `matcher` is provided, any `value` matches.
 *
 * @param value String to match
 * @param matcher String or RegExp to match against
 * @return `true` if it is a match, `false` otherwise
 */
export function nameMatch(value: string, matcher?: string | RegExp): boolean {
    if (typeof matcher === "string") {
        return matcher === value;
    } else if (matcher instanceof RegExp) {
        return matcher.test(value);
    } else if (!matcher) {
        return true;
    } else {
        throw new Error(`Provided matcher is neither a string or RegExp: ${stringify(matcher)}: ${typeof matcher}`);
    }
}
