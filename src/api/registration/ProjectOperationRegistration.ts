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

import { EditResult, failedEdit, successfulEdit } from "@atomist/automation-client/operations/edit/projectEditor";
import { isProject, Project } from "@atomist/automation-client/project/Project";
import { chainTransforms } from "../../api-helper/command/editor/chain";
import { SdmContext } from "../context/SdmContext";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Function that can transform a project
 */
export type CodeTransform<P = any> = ExplicitCodeTransform<P> | SimpleCodeTransform<P>;

export type ExplicitCodeTransform<P = any> = (p: Project, ctx: SdmContext) => Promise<EditResult>;

export type SimpleCodeTransform<P = any> = (p: Project, ctx: SdmContext) => Promise<Project>;

export function toExplicitCodeTransform<P>(ct: CodeTransform<P>): ExplicitCodeTransform<P> {
    return async (proj, ctx) => {
        try {
            const r: Project | EditResult = await ct(proj, ctx);
            return isProject(r) ? successfulEdit(r, undefined) : r;
        } catch (e) {
            return failedEdit(proj, e);
        }
    };
}

/**
 * One or many CodeTransforms
 */
export type CodeTransformOrTransforms<PARAMS> = CodeTransform<PARAMS> | Array<CodeTransform<PARAMS>>;

export function toScalarCodeTransform<PARAMS>(ctot: CodeTransformOrTransforms<PARAMS>): CodeTransform<PARAMS> {
    if (Array.isArray(ctot)) {
        return chainTransforms(...ctot);
    } else {
        return ctot;
    }
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
    transform: CodeTransformOrTransforms<PARAMS>;

}
