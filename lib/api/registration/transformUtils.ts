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
    logger,
    NoParameters,
    Project,
} from "@atomist/automation-client";
import {
    CodeTransform,
    TransformResult,
    TransformReturnable,
} from "./CodeTransform";

/**
 * Combine these transforms into a single transform,
 * where they execute it in order
 * @param {CodeTransform<any>} transforms
 * @return {CodeTransform<any>}
 */
export function chainTransforms<P = NoParameters>(...transforms: Array<CodeTransform<any>>): CodeTransform<P> {
    return async (p, sdmc, params) => {
        try {
            let cumulativeResult: TransformResult = {
                target: p,
                success: true,
                edited: false,
            };
            for (const t of transforms) {
                const lastResult = await t(p, sdmc, params);
                cumulativeResult = combineResults(toTransformResult(p, lastResult), cumulativeResult);
            }
            return cumulativeResult;
        } catch (error) {
            logger.warn("Editor failure in editorChain: %s", error);
            return { target: p, edited: false, success: false, error };
        }
    };
}

function isTransformResult(tr: TransformReturnable): tr is TransformResult {
    const maybe = tr as TransformResult;
    return maybe.success !== undefined;
}

function toTransformResult(p: Project, tr: TransformReturnable): TransformResult {
    if (isTransformResult(tr)) {
        return tr;
    } else {
        return { target: p, success: true, edited: undefined };
    }
}

/* tslint:disable */ // Disable tslint from incorrectly breaking checks for false vs undefined
function combineResults(r1: TransformResult, r2: TransformResult): TransformResult {
    return {
        ...r1,
        ...r2,
        edited: (r1.edited || r2.edited) ? true :
            (r1.edited === false && r2.edited === false) ? false : undefined,
        success: r1.success && r2.success,
    };
}
