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

import { OnPushToAnyBranch } from "../../typings/types";
import { Goals } from "../delivery/goals/Goal";
import { ProjectListenerInvocation } from "./Listener";

/**
 * Return true if we like this push and think a particular set of goals apply to it.
 */
export type PushTest = (p: PushTestInvocation) => boolean | Promise<boolean>;

export interface PushTestInvocation extends ProjectListenerInvocation {

    readonly push: OnPushToAnyBranch.Push;
}

/**
 * A GoalSetter decides what goals to run depending on repo contents and characteristics
 * of the push. It is fundamental to determining the flow after the push:
 * for example: do we want to run a code scan?; do we want to build?; do
 * we want to deploy?
 * @returns Goals or undefined if it doesn't like the push or
 * understand the repo
 */
export interface GoalSetter {

    /**
     * Test the push as to whether we should even think about creating goals for it.
     * If we return false here, our chooseGoals method will never be
     * called for this push
     */
    readonly guard?: PushTest;

    /**
     * Determine the goals that apply to this commit if the PushTest passes,
     * or return undefined if this GoalSetter doesn't know what to do with it.
     * The latter is not an error.
     * @param {PushTestInvocation} pci
     * @return {Promise<Goals>}
     */
    chooseGoals(pci: PushTestInvocation): Promise<Goals | undefined>;

}
