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

import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";

import * as _ from "lodash";
import { FunctionalUnit } from "./FunctionalUnit";

/**
 * Assemble multiple functional units into a single functional unit
 */
export class ComposedFunctionalUnit implements FunctionalUnit {

    public readonly units: FunctionalUnit[];

    constructor(...units: FunctionalUnit[]) {
        this.units = units;
    }

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return _.flatten(this.units.map(dm => dm.eventHandlers))
            .filter(m => !!m);
    }

    get commandHandlers(): Array<Maker<HandleCommand>> {
        return _.flatten(this.units.map(dm => dm.commandHandlers));
    }

}

export function composeFunctionalUnits(...units: FunctionalUnit[]): FunctionalUnit {
    return new ComposedFunctionalUnit(...units);
}
