
import { NoParameters } from "@atomist/automation-client";
import { logger } from "../context/exports";
import { Project } from "../project/exports";
import { CodeTransform, TransformResult, TransformReturnable } from "./CodeTransform";

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
