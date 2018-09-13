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

import { EditResult } from "@atomist/automation-client/lib/operations/edit/projectEditor";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import { ParametersInvocation } from "../listener/ParametersInvocation";

export type TransformResult = EditResult;

/**
 * Function that can transform a project. Mixing HandlerContextMethods into second
 * parameter, and third parameter are only for backward compatibility.
 * New code should use (Project, Command ParametersInvocation).
 * Projects are naturally mutable.
 */
export type CodeTransform<P = NoParameters> = (p: Project,
                                               sdmc: ParametersInvocation<P>,
                                               params?: P) => Promise<Project | TransformResult | void>;

/**
 * One or many CodeTransforms
 */
export type CodeTransformOrTransforms<PARAMS> = CodeTransform<PARAMS> | Array<CodeTransform<PARAMS>>;
