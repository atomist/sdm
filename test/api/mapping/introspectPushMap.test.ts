import { TestSoftwareDeliveryMachine } from "../../api-helper/TestSoftwareDeliveryMachine";
import { onAnyPush, whenPushSatisfies } from "../../../lib/api/dsl/goalDsl";
import { createGoal } from "../../../lib/api/goal/common/createGoal";
import { SoftwareDeliveryMachine } from "../../../lib/api/machine/SoftwareDeliveryMachine";
import { Goals } from "../../../lib/api/goal/Goals";
import * as assert from "assert";
import { PushListenerInvocation } from "../../../lib/api/listener/PushListener";
import { GoalSettingCompositionStyle, hasGoalSettingStructure } from "../../../lib/api/mapping/GoalSetter";
import { OnPushToAnyBranch } from "../../../lib/typings/types";
import { GitProject, HandlerContext, ProjectOperationCredentials, RemoteRepoRef } from "@atomist/automation-client";
import { AddressChannels } from "../../../lib/api/context/addressChannels";
import { PushMapping } from "../../../lib/api/mapping/PushMapping";
import { PushTest } from "../../../lib/api/mapping/PushTest";
import { Goal } from "../../../lib/api/goal/Goal";
import { isPredicatedStaticValue } from "../../../lib/api/mapping/support/PushRule";
import { Predicated, PredicateMapping } from "../../../lib/api/mapping/PredicateMapping";
import { StaticPushMapping } from "../../../lib/api/mapping/support/StaticPushMapping";
import { FalsePushTest, TruePushTest } from "./support/pushTestUtils.test";
import { ExecuteGoal } from "../../../lib/api/goal/GoalInvocation";


// File: throwingPushListenerInvocation
class InsufficientDataError extends Error {
    public readonly kind = "InsufficientDataError";

    constructor(missing: string) {
        super(missing);
    }
}

export function throwingPushListenerInvocation(knownBits: Partial<PushListenerInvocation>): PushListenerInvocation {
    return {
        get push(): OnPushToAnyBranch.Push {
            throw new InsufficientDataError("push");
        },
        get project(): GitProject {
            throw new InsufficientDataError("project");
        },
        get id(): RemoteRepoRef {
            throw new InsufficientDataError("id");
        },
        get context(): HandlerContext {
            throw new InsufficientDataError("context");
        },
        get addressChannels(): AddressChannels {
            throw new InsufficientDataError("addressChannels");
        },
        get credentials(): ProjectOperationCredentials {
            throw new InsufficientDataError("credentials");
        },
        ...knownBits
    };
}


// File: GoalPrediction
export type GoalPrediction = {
    definiteGoals: Goal[],
    possibleGoals: Goal[],
    unknownRoads: Array<{
        name: string,
        reason: string
    }>
}

export function definitelyNoGoals(gp: GoalPrediction): boolean {
    return gp.definiteGoals.length === 0 && gp.possibleGoals.length === 0 && (gp.unknownRoads.length === 0);
}

export function combineGoalPredictions(gp1: GoalPrediction, gp2: GoalPrediction): GoalPrediction {
    return {
        definiteGoals: gp1.definiteGoals.concat(gp2.definiteGoals),
        possibleGoals: gp1.possibleGoals.concat(gp2.possibleGoals),
        unknownRoads: gp1.unknownRoads.concat(gp2.unknownRoads),
    };
}

export const EmptyGoalPrediction: GoalPrediction = {
    definiteGoals: [],
    possibleGoals: [],
    unknownRoads: []
};

// File: predictGoals
export async function predictGoals(sdm: SoftwareDeliveryMachine, known: Partial<PushListenerInvocation>): Promise<GoalPrediction> {

    const pushMapping = sdm.pushMapping;

    const pushListenerInvocation = throwingPushListenerInvocation(known);

    return predictMapping(pushMapping, pushListenerInvocation);
}

async function predictMapping(pushMapping: PushMapping<Goals>, pli: PushListenerInvocation): Promise<GoalPrediction> {
    try {
        // optimistic
        return {
            ...EmptyGoalPrediction,
            definiteGoals: (await pushMapping.mapping(pli)).goals,
        };
    } catch (e) {
        console.log("Failed to run mapping: " + pushMapping.name + " with error: " + e.message);
        // try to break it down further; see what info we can get.
        return deconstructMapping(pushMapping, pli);
    }
}

async function deconstructMapping(pushMapping: PushMapping<Goals>, pli: PushListenerInvocation): Promise<GoalPrediction> {
    if (hasGoalSettingStructure(pushMapping)) {
        switch (pushMapping.structure.compositionStyle) {
            case GoalSettingCompositionStyle.FirstMatch:
                console.log("look, a first match");
                return possibleResultsOfFirstMatch(pushMapping.structure.components, pli);
                break;
            case GoalSettingCompositionStyle.AllMatches:
                console.log("We want all matches");
                break;
        }
    }
    if (isPredicatedStaticValue(pushMapping)) {
        return deconstructPushRule(pushMapping, pli);
    } else {
        console.log("No goals detected");
        const reason = "";
        return {
            ...EmptyGoalPrediction,
            unknownRoads: [{ name: pushMapping.name, reason: "Could not see into mapping" }]
        };
    }
}

async function deconstructPushRule(psm: StaticPushMapping<Goals> & Predicated<PushListenerInvocation>,
                                   pli: PushListenerInvocation): Promise<GoalPrediction> {
    const testPrediction = await deconstructTest(psm.test, pli);
    if (hasPredictedResult(testPrediction)) {
        // we know what we are going to return
        if (testPrediction.result) {
            return { ...EmptyGoalPrediction, definiteGoals: psm.value.goals };
        } else {
            // we know we are going to return nothing
            return EmptyGoalPrediction;
        }
    } else {
        // well, we might return these
        return { ...EmptyGoalPrediction, possibleGoals: psm.value.goals };
    }
}

type TestPrediction = { result: boolean } | { unknownRoads: [{ name: string, reason: string }] }

function hasPredictedResult(tp: TestPrediction): tp is { result: boolean } {
    return (tp as any).result !== undefined;
}

async function deconstructTest<T>(pushTest: PredicateMapping<T>, pli: T): Promise<TestPrediction> {
    try {
        return { result: await pushTest.mapping(pli) };
    } catch (e) {
        // TODO: write tests, then break down predicates. We might be able to short-circuit?
        return { unknownRoads: [{ name: pushTest.name, reason: e.message }] };
    }
}

// this is coupled to the implementation of PushRules.mapping
async function possibleResultsOfFirstMatch(rules: Array<PushMapping<Goals>>, pli: PushListenerInvocation): Promise<GoalPrediction> {
    if (rules.length === 0) {
        return EmptyGoalPrediction;
    }
    const [first, ...rest] = rules;

    let firstResult: GoalPrediction;
    try {
        const result = await first.mapping(pli);
        if (result === null) {
            // if we definitely get null, then that signals "stop processing rules" (sadly)
            return EmptyGoalPrediction;
        } else if (result === undefined) {
            // definitely no goals from here. keep going
            firstResult = EmptyGoalPrediction;
        } else {
            // we got real rules back
            return {
                ...EmptyGoalPrediction,
                definiteGoals: result.goals,
            };
        }
    } catch (e) {
        // undetermined. break it down farther, then keep going
        firstResult = await deconstructMapping(first, pli);
    }

    // Try the rest of the rules.
    const restResult = await possibleResultsOfFirstMatch(rest, pli);

    if (definitelyNoGoals(firstResult)) {
        return restResult;
    }

    // special combination. if we have possible goals, further ones are never definite.
    // ... unless the possible goals are possible in all possible rule returns, then they would be definite ... :-/ (not implemented)

    function allPossibleGoals(gp: GoalPrediction) {
        return gp.definiteGoals.concat(gp.possibleGoals);
    }

    return {
        definiteGoals: [],
        possibleGoals: allPossibleGoals(firstResult).concat(allPossibleGoals(restResult)),
        unknownRoads: firstResult.unknownRoads.concat(restResult.unknownRoads)
    };
}


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