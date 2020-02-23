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
import * as _ from "lodash";
import { computeStartingPoint } from "../../../api-helper/command/generator/generatorCommand";
import { projectLoaderRepoLoader } from "../../../api-helper/machine/projectLoaderRepoLoader";
import { toMachineOptions } from "../../../api-helper/machine/toMachineOptions";
import { CachingProjectLoader } from "../../../api-helper/project/CachingProjectLoader";
import { CommandListenerInvocation } from "../../../api/listener/CommandListener";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { GeneratorRegistration } from "../../../api/registration/GeneratorRegistration";
import { ParametersObject } from "../../../api/registration/ParametersDefinition";
import { chainTransforms } from "../../../api/registration/transformUtils";
import { toArray } from "../../util/misc/array";
import { UniversalTransform } from "./generatorSupport";

/**
 * Wrap provided generator to execute additional transformsAndParameters
 */
export function universalGenerator<P extends SeedDrivenGeneratorParameters = any>(
    sdm: SoftwareDeliveryMachine,
    generator: GeneratorRegistration<any>,
    transforms: Array<UniversalTransform<any>>): GeneratorRegistration<P> {
    return {
        ...generator,
        startingPoint: async pi => {
            const repoLoader = (p: SeedDrivenGeneratorParameters) =>
                projectLoaderRepoLoader(
                    sdm.configuration.sdm.projectLoader || new CachingProjectLoader(),
                    p.target.credentials,
                    true);

            const project = await computeStartingPoint(
                pi.parameters as any,
                pi.context,
                repoLoader(pi.parameters as any),
                { ...generator as any, redirecter: () => undefined },
                generator.startingPoint,
                generator,
                toMachineOptions(sdm));

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

            // tslint:disable-next-line:deprecation
            const trans = chainTransforms(...toArray(generator.transform || []), ...computedTransforms);
            return trans(p, pi, pi.parameters);
        },
    };
}

/**
 * Enrich parameters with the extras if needed
 */
async function enhanceWithSpecificParameters<P>(universalTransforms: Array<UniversalTransform<any>>,
                                                ctx: CommandListenerInvocation<any>): Promise<void> {

    const unsatisfiedParameters: ParametersObject<any> = {};
    for (const universalTransform of universalTransforms) {
        _.forEach(universalTransform.parameters, (v, k) => {
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
