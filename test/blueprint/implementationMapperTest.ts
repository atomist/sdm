import { SoftwareDeliveryMachine } from "../../src/blueprint/SoftwareDeliveryMachine";
import { fakeSoftwareDeliveryMachineOptions } from "./sdmGoalImplementationTest";
import { SdmGoal } from "../../src/ingesters/sdmGoalIngester";

import * as assert from "power-assert";
import * as stringify from "json-stringify-safe";
import { Goal } from "../../src/common/delivery/goals/Goal";
 import { GoalImplementation, NoFulfillmentFound } from "../../src/common/delivery/goals/SdmGoalImplementationMapper";

const customGoal = new Goal({
    uniqueName: "Jerry",
    displayName: "Springer", environment: "1-staging/", orderedName: "1-springer",
});

describe("finding the fulfillment by goal", () => {
    it("returns a friendly error when it is not found", async () => {

        const mySDM = new SoftwareDeliveryMachine("Gustave",
            fakeSoftwareDeliveryMachineOptions);
        mySDM.addGoalImplementation("Cornelius",
            customGoal,
            async () => { return { code: 0 } },
        );

        const onlyGoal = { name: "foo", fulfillment: {} } as SdmGoal;

        const myImpl = mySDM.goalFulfillmentMapper.findFulfillmentBySdmGoal(onlyGoal);

        assert((myImpl as NoFulfillmentFound).includes("foo"), stringify(myImpl));

    });
})