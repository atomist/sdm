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

import { HandlerContext } from "@atomist/automation-client";
import { EditResult, failedEdit, ProjectEditor, successfulEdit } from "@atomist/automation-client/operations/edit/projectEditor";
import { isProject, Project } from "@atomist/automation-client/project/Project";
import { toCommandListenerInvocation } from "../../api-helper/machine/handlerRegistrations";
import { CommandListenerInvocation } from "../listener/CommandListener";
import { chainTransforms } from "./CodeTransformRegistration";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Function that can transform a project
 */
export type CodeTransform<P = any> = (p: Project, sdmc: CommandListenerInvocation & HandlerContext, params?: P) => Promise<Project | EditResult>;

/**
 * One or many CodeTransforms
 */
export type CodeTransformOrTransforms<PARAMS> = CodeTransform<PARAMS> | Array<CodeTransform<PARAMS>>;

export function toScalarProjectEditor<PARAMS>(ctot: CodeTransformOrTransforms<PARAMS>): ProjectEditor<PARAMS> {
    if (Array.isArray(ctot)) {
        return chainTransforms(...ctot.map(toProjectEditor));
    } else {
        return toProjectEditor(ctot);
    }
}

function toProjectEditor<P>(ct: CodeTransform<P>): ProjectEditor<P> {
    return async (p, ctx, params) => {
        const ci = toCommandListenerInvocation(p, ctx, params);
        const r = await ct(p, {
            ...ci,
            ...ctx,
        }, params);
        try {
            return isProject(r) ? successfulEdit(r, undefined) : r;
        } catch (e) {
            return failedEdit(p, e);
        }
    };
}

/**
 * Superclass for all registrations of "project operations",
 * which can create or modify projects. Either an editor or a createEditor
 * function must be provided.
 */
export interface ProjectOperationRegistration<PARAMS> extends CommandRegistration<PARAMS> {

    /**
     * Function to transform the project
     */
    transform?: CodeTransformOrTransforms<PARAMS>;

    /**
     * @deprecated use transform
     * Create the editor function that can modify a project
     * @param {PARAMS} params
     * @return {AnyProjectEditor}
     */
    createTransform?: (params: PARAMS) => CodeTransform<PARAMS>;

    /**
     * @deprecated use transform
     */
    editor?: CodeTransform<PARAMS>;

    /**
     * @deprecated use transform
     */
    createEditor?: (params: PARAMS) => CodeTransform<PARAMS>;
}
