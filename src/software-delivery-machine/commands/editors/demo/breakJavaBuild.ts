/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HandleCommand, HandlerContext } from "@atomist/automation-client";
import { commitToMaster } from "@atomist/automation-client/operations/edit/editModes";
import { Project } from "@atomist/automation-client/project/Project";
import { editorCommand } from "../../../../common/command/editor/editorCommand";
import { EmptyParameters } from "../../../../common/command/EmptyParameters";

export const BadJavaFileName = "src/main/java/Bad.java";

export const breakJavaBuildEditor: HandleCommand = editorCommand(
    () => breakBuild,
    "breakJavaBuild",
    EmptyParameters,
    {
        editMode: commitToMaster(`You asked me to break the build!`),
    });

async function breakBuild(p: Project, ctx: HandlerContext) {
    return p.addFile(BadJavaFileName, "this is not Java");
}

export const unbreakJavaBuildEditor: HandleCommand = editorCommand(
    () => unbreakJavaBuild,
    "unbreakJavaBuild",
    EmptyParameters,
    {
        editMode: commitToMaster(`Trying to unbreak the build!`),
    });

async function unbreakJavaBuild(p: Project, ctx: HandlerContext) {
    return p.deleteFile(BadJavaFileName);
}
