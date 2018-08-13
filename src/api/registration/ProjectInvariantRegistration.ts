import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { ProjectReview, RemoteRepoRef } from "../project/exports";
import { AutofixRegistration } from "./AutofixRegistration";
import { CodeInspectionRegistration } from "./CodeInspectionRegistration";
import { CodeTransformRegistration } from "./CodeTransformRegistration";

/**
 * Can register as a code inspection
 */
export interface ProjectInvariantRegistration<PARAMS = NoParameters>
    extends CodeInspectionRegistration<InvarianceAssessment, PARAMS> {

}

/**
 * An invariant that can be enforced.
 * 3-in-1: Inspection, CodeTransform and Autofix. Emits all
 */
export interface EnforceableProjectInvariantRegistration<PARAMS = NoParameters>
    extends ProjectInvariantRegistration<PARAMS>,
        CodeTransformRegistration<PARAMS>,
        AutofixRegistration<PARAMS> {

}

export interface InvarianceAssessment {
    id: RemoteRepoRef;

    holds: boolean;

    review?: ProjectReview;
}
