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

import { RepoListenerInvocation, SdmListener } from "./Listener";

export interface FingerprintValue {
    name: string;
    sha: string;
    data: string;
}

/**
 * Represents the difference of two fingerprints with the same name.
 * Note that a fingerprint may be added or removed, so calling
 * code must check
 */
export interface FingerprintDifference {
    oldValue?: FingerprintValue;
    newValue?: FingerprintValue;
}

/**
 * Invoked on changes in fingeprints vs the previous commit
 */
export interface FingerprintDifferenceListenerInvocation extends RepoListenerInvocation {

    diffs: FingerprintDifference[];
}

/**
 * React to a fingerprint diff
 */
export type FingerprintDifferenceListener = SdmListener<FingerprintDifferenceListenerInvocation>;
