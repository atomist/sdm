
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
