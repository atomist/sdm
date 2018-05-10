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

import { TypeScriptES6FileParser } from "@atomist/automation-client/tree/ast/typescript/TypeScriptFileParser";
import { TreeNode } from "@atomist/tree-path/TreeNode";
import { ElementRequest } from "./elementRequest";

/**
 * Request for all JavaScript functions
 */
export const JavaScriptElementRequest: ElementRequest = {
    fileParser: TypeScriptES6FileParser,
    pathExpression: "//FunctionDeclaration",
    globPattern: "**/*.js",
    extractIdentifier: m => {
        const ids = m.evaluateExpression("//Identifier") as TreeNode[];
        return ids[0].$value;
    },
};
