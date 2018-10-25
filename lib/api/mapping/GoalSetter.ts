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

import * as _ from "lodash";
import { SdmContext } from "../context/SdmContext";
import { Goals } from "../goal/Goals";
import { PushListenerInvocation } from "../listener/PushListener";
import { Mapping } from "./Mapping";

/**
 * A GoalSetter decides what goals to run depending on repo contents and characteristics
 * of the push. It is fundamental to determining the flow after the push:
 * for example: do we want to run a code scan?; do we want to build?; do
 * we want to deploy?
 * @returns Goals or undefined if it doesn't like the push or
 * understand the repo
 */
export type GoalSetter<F extends SdmContext = PushListenerInvocation> = Mapping<F, Goals>;

export enum GoalSettingCompositionStyle {
    FirstMatch = "take the first one",
    AllMatches = "take all the ones that match",
}

/**
 * Some (composed) mappings contain information about their internal structure.
 *
 * It only extends Mapping<F,V> because it's expected to apply only to those
 */
export interface GoalSettingStructure<F, V> extends Mapping<F, V> {
    structure: {
        compositionStyle: GoalSettingCompositionStyle,
        components: Array<Mapping<F, V>>,
    };
}

export function hasGoalSettingStructure<F, V>(m: Mapping<F, V>): m is GoalSettingStructure<F, V> {
    const maybe = m as GoalSettingStructure<F, V>;
    return maybe.structure &&
        maybe.structure.compositionStyle &&
        Object.values(GoalSettingCompositionStyle).includes(maybe.structure.compositionStyle);
}
