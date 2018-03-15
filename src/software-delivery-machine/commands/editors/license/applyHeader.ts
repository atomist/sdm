import { HandleCommand, HandlerContext, logger, Parameter, Parameters } from "@atomist/automation-client";
import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { AllJavaFiles } from "@atomist/spring-automation/commands/generator/java/javaProjectUtils";
import { editorCommand } from "../../../../handlers/commands/editors/editorCommand";
import { OptionalBranchParameters } from "../support/OptionalBranchParameters";

@Parameters()
export class ApplyHeaderParameters extends OptionalBranchParameters {

    constructor(public header: string) {
        super();
    }
}

/* tslint:disable */
const ApacheHeader = `/*
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
 */`;

export const applyApacheLicenseHeaderEditor: HandleCommand = editorCommand(
    () => applyHeaderProjectEditor,
    "addHeader",
    () => new ApplyHeaderParameters(ApacheHeader),
    {
        editMode: ahp => ({
            message: `Apply header from ${ahp.donorPath}`,
            branch: ahp.branch || "ah-" + new Date().getTime(),
        }),
    });

export async function applyHeaderProjectEditor(p: Project, ctx: HandlerContext, params: ApplyHeaderParameters) {
    return await doWithFiles(p, AllJavaFiles, async f => {
        const content = await f.getContent();
        return f.setContent(params.header + "\n" + content);
    });
}
