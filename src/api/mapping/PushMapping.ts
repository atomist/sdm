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

import { PushListenerInvocation } from "../listener/PushListener";
import { Mapping, NeverMatch } from "./Mapping";

/**
 * Constant to indicate we should never match
 * @type {any}
 */
export const DoNotSetAnyGoals: NeverMatch = null;

/**
 * Mapper from push to value, id it can be resolved.
 * This is a central interface used throughout the SDM.
 */
export type PushMapping<V> = Mapping<PushListenerInvocation, V>;
