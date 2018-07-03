import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { AbstractSoftwareDeliveryMachine } from "../../src/api-helper/machine/AbstractSoftwareDeliveryMachine";
import { GoalSetter } from "../../src/api/mapping/GoalSetter";

export class TestSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    public readonly commandHandlers: Array<Maker<HandleCommand>>;
    public readonly eventHandlers: Array<Maker<HandleEvent<any>>>;
    public readonly goalFulfillmentMapper;
    public readonly ingesters: string[];

    constructor(name: string, ...goalSetters: Array<GoalSetter | GoalSetter[]>) {
        super("name", undefined, goalSetters);
    }

}
