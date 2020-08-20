/*
 * Copyright © 2020 Atomist, Inc.
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

import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/lib/operations/generate/SeedDrivenGeneratorParameters";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import * as _ from "lodash";
import { computeStartingPoint } from "../../api-helper/command/generator/generatorCommand";
import { projectLoaderRepoLoader } from "../../api-helper/machine/projectLoaderRepoLoader";
import { toMachineOptions } from "../../api-helper/machine/toMachineOptions";
import { CachingProjectLoader } from "../../api-helper/project/CachingProjectLoader";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import {
	CodeTransform,
	TransformResult,
	TransformReturnable,
} from "../../api/registration/CodeTransform";
import { GeneratorRegistration } from "../../api/registration/GeneratorRegistration";
import { ParametersObject } from "../../api/registration/ParametersDefinition";
import { toArray } from "../../core/util/misc/array";
import { UniversalTransform } from "./generatorSupport";

/**
 * Wrap provided generator to execute additional transformsAndParameters
 */
export function universalGenerator<P extends SeedDrivenGeneratorParameters = any>(
	sdm: SoftwareDeliveryMachine,
	generator: GeneratorRegistration<any>,
	transforms: Array<UniversalTransform<any>>,
): GeneratorRegistration<P> {
	return {
		...generator,
		startingPoint: async pi => {
			const repoLoader = (p: SeedDrivenGeneratorParameters) =>
				projectLoaderRepoLoader(
					sdm.configuration.sdm.projectLoader || new CachingProjectLoader(),
					p.target.credentials,
					true,
				);

			const project = await computeStartingPoint(
				pi.parameters as any,
				pi.context,
				repoLoader(pi.parameters as any),
				{ ...(generator as any), redirecter: () => undefined },
				generator.startingPoint,
				generator,
				toMachineOptions(sdm),
			);

			const transformsToApply = [];
			for (const transform of transforms) {
				if (!!transform.test) {
					if (await transform.test(project)) {
						transformsToApply.push(transform);
					}
				} else {
					transformsToApply.push(transform);
				}
			}

			await enhanceWithSpecificParameters(transformsToApply, pi as any);

			// Safe the transformsAndParameters to invoke on the invocation to re-use later
			(pi as any).parameters.__transforms = transformsToApply;
			return project;
		},
		transform: async (p, pi) => {
			const universalTransforms = (pi.parameters as any).__transforms as Array<UniversalTransform<any>>;
			const computedTransforms = _.flatten(universalTransforms.map(t => toArray(t.transforms)));

			const trans = chainTransforms(...toArray(generator.transform || []), ...computedTransforms);
			return trans(p, pi, pi.parameters);
		},
	};
}

/**
 * Enrich parameters with the extras if needed
 */
async function enhanceWithSpecificParameters<P>(
	universalTransforms: Array<UniversalTransform<any>>,
	ctx: CommandListenerInvocation<any>,
): Promise<void> {
	const unsatisfiedParameters: ParametersObject<any> = {};
	for (const universalTransform of universalTransforms) {
		let params: ParametersObject<any>;
		if (typeof universalTransform.parameters === "function") {
			const paramsValues: any = await ctx.promptFor<P>(unsatisfiedParameters);
			params = await universalTransform.parameters({ ...ctx.parameters, ...paramsValues });
		} else {
			params = universalTransform.parameters;
		}
		_.forEach(params, (v, k) => {
			if (ctx.parameters[k] === undefined) {
				unsatisfiedParameters[k] = v;
			}
		});
	}

	const newParams: any = await ctx.promptFor<P>(unsatisfiedParameters);

	for (const name of Object.getOwnPropertyNames(newParams)) {
		ctx.parameters[name] = newParams[name];
	}
}

function chainTransforms<P = NoParameters>(...transforms: Array<CodeTransform<any>>): CodeTransform<P> {
	return async (p, sdmc, params) => {
		let cumulativeResult: TransformResult = {
			target: p,
			success: true,
			edited: false,
		};
		try {
			for (const t of transforms) {
				const lastResult = await t(p, sdmc, params);
				cumulativeResult = combineResults(toTransformResult(p, lastResult), cumulativeResult);
			}
			return cumulativeResult;
		} catch (error) {
			return { target: p, edited: cumulativeResult.edited, success: false, error };
		}
	};
}

function toTransformResult(p: Project, tr: TransformReturnable): TransformResult {
	const maybe = tr as TransformResult;
	if (maybe && maybe.success !== undefined) {
		return maybe;
	} else {
		return { target: p, success: true, edited: undefined };
	}
}

function combineResults(r1: TransformResult, r2: TransformResult): TransformResult {
	return {
		...r1,
		...r2,
		edited: r1.edited || r2.edited ? true : r1.edited === false && r2.edited === false ? false : undefined,
		success: r1.success && r2.success,
	};
}
