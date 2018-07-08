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


import { CommandDetails } from "@atomist/automation-client/operations/CommandDetails";
import {
    BaseEditorOrReviewerParameters,
    EditorOrReviewerParameters,
} from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { FallbackParams } from "@atomist/automation-client/operations/common/params/FallbackParams";
import { andFilter, RepoFilter } from "@atomist/automation-client/operations/common/repoFilter";
import { EditMode, isEditMode, PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { SmartParameters } from "@atomist/automation-client/SmartParameters";
import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";
import * as assert from "assert";
import { CommandListener } from "../../../api/listener/CommandListener";
import { CodeTransform } from "../../../api/registration/ProjectOperationRegistration";
import { transformAll, transformOne } from "./transformAll";

/**
 * Either directly return an EditMode or a factory to return one from the context
 */
export type EditModeOrFactory<PARAMS> = EditMode | ((p: PARAMS) => EditMode);

/**
 * Further details of an editor to allow selective customization
 */
export interface EditorCommandDetails<PARAMS = any> extends CommandDetails<PARAMS> {

    editMode: EditModeOrFactory<PARAMS>;
    repoFilter?: RepoFilter;
}

function defaultDetails(name: string): EditorCommandDetails {
    return {
        description: name,
        editMode: new PullRequest(name, name),
    };
}

/**
 * Create a handle function that edits one or many repos, following AllReposByDefaultParameters
 * @param {string} name
 * @param {string} details object allowing customization beyond reasonable defaults
 * @return {HandleCommand}
 */
export function codeTransformListener<PARAMS extends EditorOrReviewerParameters>(ct: CodeTransform<PARAMS>,
                                                                                 name: string,
                                                                                 details: Partial<EditorCommandDetails> = {}): CommandListener<PARAMS> {
    const detailsToUse: EditorCommandDetails = {
        ...defaultDetails(name),
        ...details,
    };
    return handleEditOneOrMany(ct, detailsToUse);
}

/**
 * If owner and repo are required, edit just one repo. Otherwise edit all repos
 * in the present team
 */
function handleEditOneOrMany<PARAMS extends BaseEditorOrReviewerParameters>(ct: CodeTransform<PARAMS>,
                                                                            details: EditorCommandDetails): CommandListener<PARAMS> {
    return ci => {
        if (!!ci.parameters.targets.repoRef) {
            return transformOne(ci,
                ct,
                editModeFor(details.editMode, ci.parameters),
                ci.parameters.targets.repoRef,
                ci.parameters,
                !!details.repoLoader ? details.repoLoader(ci.parameters) : undefined);
        }
        return transformAll(ci, ct,
            editModeFor(details.editMode, ci.parameters),
            ci.parameters,
            details.repoFinder,
            andFilter(ci.parameters.targets.test, details.repoFilter),
            !!details.repoLoader ? details.repoLoader(ci.parameters) : undefined);
    };
}

function editModeFor<PARAMS>(emf: EditModeOrFactory<PARAMS>, p: PARAMS): EditMode {
    return isEditMode(emf) ?
        emf :
        emf(p);
}

/**
 * Return a parameters maker that is targeting aware
 * @param {Maker<PARAMS>} paramsMaker
 * @param targets targets parameters to set if necessary
 * @return {Maker<EditorOrReviewerParameters & PARAMS>}
 */
export function toCodeTransformParametersMaker<PARAMS>(paramsMaker: Maker<PARAMS>,
                                                       targets: FallbackParams): Maker<EditorOrReviewerParameters & PARAMS> {
    const sampleParams = toFactory(paramsMaker)();
    return isEditorOrReviewerParameters(sampleParams) ?
        paramsMaker as Maker<EditorOrReviewerParameters & PARAMS> :
        () => {
            const rawParms: PARAMS = toFactory(paramsMaker)();
            const allParms = rawParms as EditorOrReviewerParameters & PARAMS & SmartParameters;
            allParms.targets = targets;
            allParms.bindAndValidate = () => {
                validate(targets);
            };
            return allParms;
        };
}

function isEditorOrReviewerParameters(p: any): p is EditorOrReviewerParameters {
    return !!(p as EditorOrReviewerParameters).targets;
}

function validate(targets: FallbackParams) {
    if (!targets.repo) {
        assert(!!targets.repos, "Must set repos or repo");
        targets.repo = targets.repos;
    }
}
