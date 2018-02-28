
import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";

import * as _ from "lodash";
import { FunctionalUnit } from "./FunctionalUnit";

/**
 * Assemble multiple functional machines into a single higher level machine
 */
export class MachineAssembler implements FunctionalUnit {

    public readonly deliveryMachines: FunctionalUnit[];

    constructor(...machines: FunctionalUnit[]) {
        this.deliveryMachines = machines;
    }

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return _.flatten(this.deliveryMachines.map(dm => dm.eventHandlers))
            .filter(m => !!m);
    }

    get commandHandlers(): Array<Maker<HandleCommand>> {
        return _.flatten(this.deliveryMachines.map(dm => dm.commandHandlers));
    }

}
