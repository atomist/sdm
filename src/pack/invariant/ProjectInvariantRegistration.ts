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

import { NoParameters } from "@atomist/automation-client/SmartParameters";
import {
    ProjectReview,
    RemoteRepoRef,
} from "../../api/project/exports";
import { AutofixRegistration } from "../../api/registration/AutofixRegistration";
import {
    CodeInspection,
    CodeInspectionActions,
    CodeInspectionRegistration, CodeInspectionResult,
} from "../../api/registration/CodeInspectionRegistration";
import { CodeTransformRegistration } from "../../api/registration/CodeTransformRegistration";
import { toStringArray } from "@atomist/automation-client/internal/util/string";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import { CodeTransformOrTransforms } from "../../api/registration/CodeTransform";
import { toScalarProjectEditor } from "../../api-helper/machine/handlerRegistrations";

/**
 * Can register as a code inspection
 */
export interface ProjectInvariantRegistration<PARAMS = NoParameters>
    extends CodeInspectionRegistration<InvarianceAssessment, PARAMS> {

}

/**
 * An invariant that can be enforced via an autofix.
 * Based around a CodeTransform which can be used as a command or an autofix.
 * If the CodeInspection isn't specified, a CodeInspection will be created
 * based on running the transform and seeing if it makes changes.
 */
export interface EnforceableProjectInvariantRegistration<PARAMS = NoParameters>
    extends Partial<CodeInspectionActions<InvarianceAssessment, PARAMS>>,
        CodeTransformRegistration<PARAMS>,
        AutofixRegistration<PARAMS> {

}

/**
 * Result of assessing an invariant against a repo
 */
export interface InvarianceAssessment {

    id: RemoteRepoRef;

    /**
     * Does the invariant hold for this project?
     */
    holds: boolean;

    review?: ProjectReview;

    details?: string;
}


function toCodeInspectionCommand<PARAMS>(
    eir: EnforceableProjectInvariantRegistration<PARAMS>): CodeInspectionRegistration<InvarianceAssessment, PARAMS> {
    return {
        name: `verify-${eir.name}`,
        intent: !!eir.intent ? toStringArray(eir.intent).map(i => `verify ${i}`) : `verify ${eir.name}`,
        parameters: eir.parameters,
        projectTest: eir.projectTest,
        onInspectionResults: eir.onInspectionResults || defaultOnInspectionResults(eir.name),
        description: eir.description,
        tags: eir.tags,
        targets: eir.targets,
        repoFinder: eir.repoFinder,
        repoFilter: eir.repoFilter,
        repoLoader: eir.repoLoader,
        inspection: eir.inspection || transformToInspection(eir.transform),
    };
}

function defaultOnInspectionResults<PARAMS>(name: string) {
    return async (results: Array<CodeInspectionResult<InvarianceAssessment>>, ci: CommandListenerInvocation<PARAMS>) => {
        const messages = results.map(r =>
            // TODO cast will go with automation-client upgrade
            `${(r.repoId as RemoteRepoRef).url}: Satisfies invariant _${name}_: \`${r.result.holds}\``);
        return ci.addressChannels(messages.join("\n"));
    };
}

/**
 * Return a AutoCodeInspection that runs a transform and sees whether or it made
 * an edit
 * @param {CodeTransformOrTransforms<PARAMS>} transform
 * @return {CodeInspection<InvarianceAssessment, PARAMS>}
 */
function transformToInspection<PARAMS>(transform: CodeTransformOrTransforms<PARAMS>): CodeInspection<InvarianceAssessment, PARAMS> {
    const editor = toScalarProjectEditor(transform);
    return async (p, i) => {
        const result = await editor(p, i.context, i.parameters);
        return {
            id: p.id as RemoteRepoRef,
            holds: !result.edited,
            details: `Transform result edited returned ${result.edited}`,
        };
    };
}
