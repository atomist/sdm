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

import { Goals } from "../delivery/goals/Goals";
import { ProjectListenerInvocation } from "./Listener";
import { PushTest } from "./PushTest";

/**
 * A PushChoice decides on a value depending on repo contents and characteristics
 * of the push.
 * @returns value if it can be resolved for this
 */
export interface PushChoice<V> {

    /**
     * Test the push as to whether we should even think about finding
     * a value for it. If we return false here, the choose method will never be
     * called for this push
     */
    readonly guard?: PushTest;

    /**
     * Determine the value that applies to this commit if the PushTest passes,
     * or return undefined if this GoalSetter doesn't know what to do with it.
     * The latter is not an error.
     * @return {Promise<Goals>}
     */
    choose(pci: ProjectListenerInvocation): Promise<V | undefined>;

}
