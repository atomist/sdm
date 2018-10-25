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

import {
    GitProject,
    HandlerContext,
    ProjectOperationCredentials,
    RemoteRepoRef,
} from "@atomist/automation-client";
import * as _ from "lodash";
import { AddressChannels } from "../../../lib/api/context/addressChannels";
import { Goal } from "../../../lib/api/goal/Goal";
import { Goals } from "../../../lib/api/goal/Goals";
import { PushListenerInvocation } from "../../../lib/api/listener/PushListener";
import { SoftwareDeliveryMachine } from "../../../lib/api/machine/SoftwareDeliveryMachine";
import { GoalSettingCompositionStyle, hasGoalSettingStructure } from "../../../lib/api/mapping/GoalSetter";
import { Predicated, PredicateMapping, PredicateMappingCompositionStyle } from "../../../lib/api/mapping/PredicateMapping";
import { PushMapping } from "../../../lib/api/mapping/PushMapping";
import { isPredicatedStaticValue } from "../../../lib/api/mapping/support/PushRule";
import { StaticPushMapping } from "../../../lib/api/mapping/support/StaticPushMapping";
import { OnPushToAnyBranch } from "../../../lib/typings/types";

// Model for what we could do in a pack

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
        ...knownBits,
    };
}

// File: GoalPrediction
export interface GoalPrediction {
    definiteNull: boolean;
    definiteGoals: Goal[];
    possibleGoals: Goal[];
    unknownRoads: Array<{
        name: string,
        reason: string,
    }>;
}

export function definitelyNoGoals(gp: GoalPrediction): boolean {
    return gp.definiteGoals.length === 0 && gp.possibleGoals.length === 0 && (gp.unknownRoads.length === 0);
}

export function combineGoalPredictions(gp1: GoalPrediction, gp2: GoalPrediction): GoalPrediction {
    return {
        definiteNull: gp1.definiteNull || gp2.definiteNull,
        definiteGoals: gp1.definiteGoals.concat(gp2.definiteGoals),
        possibleGoals: gp1.possibleGoals.concat(gp2.possibleGoals),
        unknownRoads: gp1.unknownRoads.concat(gp2.unknownRoads),
    };
}

export const EmptyGoalPrediction: GoalPrediction = {
    definiteNull: false,
    definiteGoals: [],
    possibleGoals: [],
    unknownRoads: [],
};

// File: predictGoals
export async function predictGoals(sdm: SoftwareDeliveryMachine, known: Partial<PushListenerInvocation>): Promise<GoalPrediction> {

    const pushMapping = sdm.pushMapping;

    const pushListenerInvocation = throwingPushListenerInvocation(known);

    return predictMapping(pushMapping, pushListenerInvocation);
}

async function predictMapping(pushMapping: PushMapping<Goals>, pli: PushListenerInvocation): Promise<GoalPrediction> {
    if (hasGoalSettingStructure(pushMapping)) {
        switch (pushMapping.structure.compositionStyle) {
            case GoalSettingCompositionStyle.FirstMatch:
                return possibleResultsOfFirstMatch(pushMapping.structure.components, pli);
            case GoalSettingCompositionStyle.AllMatches:
                break;
        }
    }
    if (isPredicatedStaticValue(pushMapping)) {
        return deconstructPushRule(pushMapping, pli);
    } else {
        try {
            const result = await pushMapping.mapping(pli);
            if (result === null) {
                return {
                    ...EmptyGoalPrediction,
                    definiteNull: true,
                };
            }
            return {
                ...EmptyGoalPrediction,
                definiteGoals: result.goals,
            };
        } catch (e) {
            return {
                ...EmptyGoalPrediction,
                unknownRoads: [{ name: pushMapping.name, reason: e.message }],
            };
        }
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

interface UnknownTestPrediction { unknownRoads: Array<{ name: string, reason: string }>; }
type TestPrediction = { result: boolean } | UnknownTestPrediction;

function hasPredictedResult(tp: TestPrediction): tp is { result: boolean } {
    return (tp as any).result !== undefined;
}

function combineTestPredictionUnknowns(tps: TestPrediction[]): UnknownTestPrediction {
    const unknowns: UnknownTestPrediction[] = tps.filter(tp => !hasPredictedResult(tp)).map(t => t as UnknownTestPrediction);
    return { unknownRoads: _.flatten(unknowns.map(utp => utp.unknownRoads)) };
}

async function deconstructTest<T>(pushTest: PredicateMapping<T>, pli: T): Promise<TestPrediction> {

    if (pushTest.structure) {
        const innerResults = await Promise.all(
            pushTest.structure.components.map(inner => deconstructTest(inner, pli)));
        const results = innerResults.filter(hasPredictedResult);
        const unknowns = combineTestPredictionUnknowns(innerResults);
        switch (pushTest.structure.compositionStyle) {
            case PredicateMappingCompositionStyle.And:
                if (results.find(ir => !ir.result)) {
                    // any false => false
                    return { result: false };
                } else if (unknowns.unknownRoads.length > 0) {
                    // any error => error
                    return unknowns;
                } else {
                    // guess everything was true
                    return { result: true };
                }
            case PredicateMappingCompositionStyle.Or:
                if (results.find(ir => ir.result)) {
                    // any true => true
                    return { result: true };
                } else if (unknowns.unknownRoads.length > 0) {
                    // any error => error
                    return unknowns;
                } else {
                    // guess everything was false
                    return { result: false };
                }
        }
    }
    // we can't dig into it, so try it
    try {
        return { result: await pushTest.mapping(pli) };
    } catch (e) {
        return { unknownRoads: [{ name: pushTest.name, reason: e.message }] };
    }
}

// this is coupled to the implementation of PushRules.mapping
async function possibleResultsOfFirstMatch(rules: Array<PushMapping<Goals>>, pli: PushListenerInvocation): Promise<GoalPrediction> {
    if (rules.length === 0) {
        return EmptyGoalPrediction;
    }
    const [first, ...rest] = rules;

    const firstResult: GoalPrediction = await predictMapping(first, pli);

    if (firstResult.definiteNull) {
        // if we definitely get null, then that signals "stop processing rules" (sadly)
        // this is the only place where null has meaning
        return EmptyGoalPrediction;
    }
    if (firstResult.definiteGoals.length > 0) {
        // we definitely got something. stop here.
        return firstResult;
    }

    // Try the rest of the rules.
    const restResult = await possibleResultsOfFirstMatch(rest, pli);

    // If the first result has possible goals, further ones are never definite.
    // ... unless the possible goals are possible in all possible rule returns, then they would be definite ... :-/ (not implemented)

    if (firstResult.possibleGoals.length > 0) {
        restResult.possibleGoals = restResult.possibleGoals.concat(restResult.definiteGoals);
        restResult.definiteGoals = [];
    }

    return combineGoalPredictions(firstResult, restResult);
}
