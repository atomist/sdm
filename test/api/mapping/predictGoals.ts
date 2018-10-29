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
import { Goals } from "../../../lib/api/goal/Goals";
import { PushListenerInvocation } from "../../../lib/api/listener/PushListener";
import { SoftwareDeliveryMachine } from "../../../lib/api/machine/SoftwareDeliveryMachine";
import {
    GoalSettingCompositionStyle,
    hasGoalSettingStructure,
} from "../../../lib/api/mapping/GoalSetter";
import {
    isExplicableMapping,
    MappingCompositionStyle,
} from "../../../lib/api/mapping/Mapping";
import {
    Predicated,
    PredicateMapping,
    PredicateMappingCompositionStyle,
} from "../../../lib/api/mapping/PredicateMapping";
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
export interface MappingPrediction<T> {
    definiteNull: boolean;
    definiteGoals: T[];
    possibleGoals: T[];
    unknownRoads: Array<{
        name: string,
        reason: string,
    }>;
}

export function mapMappingPrediction<T, T2>(mp: MappingPrediction<T>, f: (t: T) => T2): MappingPrediction<T2> {
    return {
        definiteNull: mp.definiteNull,
        definiteGoals: mp.definiteGoals.map(f),
        possibleGoals: mp.possibleGoals.map(f),
        unknownRoads: mp.unknownRoads,
    };
}

export function combinePredictions<T>(gp1: MappingPrediction<T>, gp2: MappingPrediction<T>): MappingPrediction<T> {
    return {
        definiteNull: gp1.definiteNull || gp2.definiteNull,
        definiteGoals: gp1.definiteGoals.concat(gp2.definiteGoals),
        possibleGoals: gp1.possibleGoals.concat(gp2.possibleGoals),
        unknownRoads: gp1.unknownRoads.concat(gp2.unknownRoads),
    };
}

export const EmptyGoalPrediction: MappingPrediction<any> = {
    definiteNull: false,
    definiteGoals: [],
    possibleGoals: [],
    unknownRoads: [],
};

// File: predictGoals
export async function predictGoals(sdm: SoftwareDeliveryMachine,
                                   known: Partial<PushListenerInvocation>): Promise<MappingPrediction<Goals>> {
    const pushMapping = sdm.pushMapping;
    const pushListenerInvocation = throwingPushListenerInvocation(known);
    return predictMapping(pushMapping, pushListenerInvocation);
}

async function predictMapping<T>(pushMapping: PushMapping<T>, pli: PushListenerInvocation): Promise<MappingPrediction<T>> {
    if (hasGoalSettingStructure(pushMapping)) {
        switch (pushMapping.structure.compositionStyle) {
            case GoalSettingCompositionStyle.FirstMatch:
                return possibleResultsOfFirstMatch(pushMapping.structure.components, pli);
            case GoalSettingCompositionStyle.AllMatches:
                return accumulateAdditiveResults(pushMapping.structure.components, pli);
        }
    }
    if (isExplicableMapping(pushMapping)) {
        switch (pushMapping.structure.compositionStyle) {
            case MappingCompositionStyle.ApplyFunctionToOutput:
                const innerResult = await predictMapping(pushMapping.structure.component, pli);
                return mapMappingPrediction(innerResult, pushMapping.structure.applyFunction);
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
                definiteGoals: [result],
            };
        } catch (e) {
            return {
                ...EmptyGoalPrediction,
                unknownRoads: [{ name: pushMapping.name, reason: e.message }],
            };
        }
    }
}

async function accumulateAdditiveResults<T>(pms: Array<PushMapping<T>>, pli: PushListenerInvocation): Promise<MappingPrediction<T>> {
    const predictions = await Promise.all(pms.map(pm => predictMapping(pm, pli)));
    return predictions.reduce(combinePredictions, EmptyGoalPrediction);
}

async function deconstructPushRule<T>(psm: StaticPushMapping<T> & Predicated<PushListenerInvocation>,
                                      pli: PushListenerInvocation): Promise<MappingPrediction<T>> {
    const testPrediction = await deconstructTest(psm.test, pli);
    if (hasPredictedResult(testPrediction)) {
        // we know what we are going to return
        if (testPrediction.result) {
            return { ...EmptyGoalPrediction, definiteGoals: [psm.value] };
        } else {
            // we know we are going to return nothing
            return EmptyGoalPrediction;
        }
    } else {
        // well, we might return these
        return { ...EmptyGoalPrediction, possibleGoals: [psm.value] };
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
async function possibleResultsOfFirstMatch<T>(rules: Array<PushMapping<T>>,
                                              pli: PushListenerInvocation): Promise<MappingPrediction<T>> {
    if (rules.length === 0) {
        return EmptyGoalPrediction;
    }
    const [first, ...rest] = rules;

    const firstResult: MappingPrediction<T> = await predictMapping(first, pli);

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

    return combinePredictions(firstResult, restResult);
}
