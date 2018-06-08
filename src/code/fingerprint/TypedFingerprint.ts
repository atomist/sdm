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

import { AbstractFingerprint } from "./AbstractFingerprint";

/**
 * Typed fingerprint. Takes care of serializing the passed in data structure.
 */
export class TypedFingerprint<T> extends AbstractFingerprint {

    public constructor(name: string,
                       abbreviation: string,
                       version: string,
                       private readonly t: T) {
        super(name, abbreviation, version);
    }

    get data(): string {
        return JSON.stringify(this.t);
    }

    /**
     * Return the fingerprint as a JSON object
     * @return {T}
     */
    get object(): T {
        return JSON.parse(this.data);
    }

}
