import { TestSoftwareDeliveryMachine } from "../../api-helper/TestSoftwareDeliveryMachine";
import { onAnyPush, whenPushSatisfies } from "../../../lib/api/dsl/goalDsl";
import { createGoal } from "../../../lib/api/goal/common/createGoal";
import { Goals } from "../../../lib/api/goal/Goals";
import * as assert from "assert";
import { PushTest } from "../../../lib/api/mapping/PushTest";
import { FalsePushTest, TruePushTest } from "./support/pushTestUtils.test";
import { ExecuteGoal } from "../../../lib/api/goal/GoalInvocation";
import { predictGoals } from "../../../lib/pack/interpret-push-map/interpret";


describe("making use of the pushMap structure", function () {
    const doNothing: ExecuteGoal = async () => { // do nothing
    };
    const myGoal = createGoal({ displayName: "myGoal" }, doNothing);
    const anotherGoal = createGoal({ displayName: "anotherGoal" }, doNothing);
    const notSetGoal = createGoal({ displayName: "notSetGoal" }, doNothing);

    it("Can see that obvious goals will be returned", async () => {
        const sdm = new TestSoftwareDeliveryMachine("test goal setting structure",
            onAnyPush().setGoals(myGoal));

        const result = await predictGoals(sdm, {});

        assert.deepStrictEqual(result.definiteGoals, [myGoal]);
    });

    const LooksAtPush: PushTest = { name: "looks at push", mapping: async (pli) => !!pli.push };

    it("Can guess at a push-dependent test", async () => {
        const sdm = new TestSoftwareDeliveryMachine("test goal setting structure",
            whenPushSatisfies(LooksAtPush).setGoals(myGoal));

        const result = await predictGoals(sdm, {});

        assert.deepStrictEqual(result, { definiteGoals: [], possibleGoals: [myGoal], unknownRoads: [] });
    });

    it("Skips over a definitely-unmatching PushRule", async () => {
        const sdm = new TestSoftwareDeliveryMachine("test goal setting structure",
            whenPushSatisfies(FalsePushTest).setGoals(notSetGoal),
            whenPushSatisfies(TruePushTest).setGoals(myGoal));

        const result = await predictGoals(sdm, {});

        assert.deepStrictEqual(result, { definiteGoals: [myGoal], possibleGoals: [], unknownRoads: [] });
    });

    it("Reports all goals as possible when PushRules are undetermined", async () => {
        const sdm = new TestSoftwareDeliveryMachine("test goal setting structure",
            whenPushSatisfies(LooksAtPush).setGoals(anotherGoal),
            whenPushSatisfies(TruePushTest).setGoals(myGoal));

        const result = await predictGoals(sdm, {});

        assert.deepStrictEqual(result, {
            definiteGoals: [],
            possibleGoals: [anotherGoal, myGoal], // order doesn't really matter afaik
            unknownRoads: []
        });
    });

    it("Reports that it cannot follow a custom PushRule", async () => {
        const sdm = new TestSoftwareDeliveryMachine("test goal setting structure",
            [{
                name: "My custom goal setter",
                mapping: async (pli) => {
                    if (pli.push) {
                        return new Goals("this is mysterious");
                    }
                }
            }]);

        const result = await predictGoals(sdm, {});

        assert.deepStrictEqual(result,
            {
                definiteGoals: [],
                possibleGoals: [],
                unknownRoads: [{ name: "My custom goal setter", reason: "Could not see into mapping" }]
            });
    });

    it("Stops after a matching PushRules");

    it("works with AdditiveGoalSetter");


});