import { TestSoftwareDeliveryMachine } from "../../api-helper/TestSoftwareDeliveryMachine";
import { onAnyPush } from "../../../lib/api/dsl/goalDsl";
import { createGoal } from "../../../lib/api/goal/common/createGoal";
import { SoftwareDeliveryMachine } from "../../../lib/api/machine/SoftwareDeliveryMachine";
import { Goals } from "../../../lib/api/goal/Goals";
import * as assert from "assert";
import { Goal } from "../../../lib/api/goal/Goal";
import { PushListenerInvocation } from "../../../lib/api/listener/PushListener";
import { GoalSettingCompositionStyle, hasGoalSettingStructure } from "../../../lib/api/mapping/GoalSetter";

/**
 * Placeholder for where the mappings are not explicit enough for us to tell
 */
const PossibleAdditionalGoals: Goal = {
    name: "Unknown Goals",
} as Goal;

async function predictGoals(sdm: SoftwareDeliveryMachine, knownParts: Partial<PushListenerInvocation>): Promise<Goals> {

    const pushMapping = sdm.pushMapping;

    if (hasGoalSettingStructure(pushMapping)) {
        switch (pushMapping.structure.compositionStyle) {
            case GoalSettingCompositionStyle.FirstMatch:
                console.log("look, a first match");
                break;
            case GoalSettingCompositionStyle.AllMatches:
                console.log("We want all matches");
                break;
        }
    } else {
        console.log("No goals detected");
        return new Goals("nothing");
    }

    return null;
}

describe("making use of the pushMap structure", function () {
    it("Can see which goals might be returned", async () => {

        const myGoal = createGoal({ displayName: "myGoal "}, async () => {});

        const sdm = new TestSoftwareDeliveryMachine("test goal setting structure",
            onAnyPush().setGoals(myGoal));

        const result = await predictGoals(sdm, {});

        assert.deepStrictEqual(result.goals, [myGoal]);

    })
});