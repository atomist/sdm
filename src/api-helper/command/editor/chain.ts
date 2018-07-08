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



import { logger } from "@atomist/automation-client";
import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { CodeTransform, ExplicitCodeTransform, toExplicitCodeTransform } from "../../../api/registration/ProjectOperationRegistration";

/**
 * Chain the transforms, in the given order
 */
export function chainTransforms(...transforms: CodeTransform[]): ExplicitCodeTransform {
    const explicitTransforms = transforms.map(toExplicitCodeTransform);
    return async (p, ctx) => {
        try {
            let cumulativeResult: EditResult = {
                target: p,
                success: true,
                edited: false,
            };
            for (const pe of explicitTransforms) {
                const lastResult = await pe(p, ctx);
                cumulativeResult = combineEditResults(lastResult, cumulativeResult);
            }
            return cumulativeResult;
        } catch (error) {
            logger.warn("Editor failure in editorChain: %s", error);
            return { target: p, edited: false, success: false, error };
        }
    };
}

export function combineEditResults(r1: EditResult, r2: EditResult): EditResult {
    return {
        ...r1,
        ...r2,
        edited: (r1.edited || r2.edited) ? true :
            (!r1.edited && !r2.edited) ? false : undefined,
        success: r1.success && r2.success,
    };
}
