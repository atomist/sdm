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

import { MatchResult } from "@atomist/automation-client/lib/tree/ast/FileHits";

/**
 * Part of a file we can work around
 */
export interface BoundedElement {
    /**
     * Value of whole element
     */
    value: string;

    /**
     * Offset within the file
     */
    offset: number;

    /**
     * Save point to insert after this element
     */
    insertAfter: number;
}

export function toBoundedElement(m: MatchResult): BoundedElement {
    return {
        value: m.$value,
        offset: m.$offset,
        insertAfter: m.$offset + m.$value.length,
    };
}
