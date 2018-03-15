import { HandleCommand, HandlerContext, Parameters } from "@atomist/automation-client";
import { Parameter } from "@atomist/automation-client";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { AllJavaFiles } from "@atomist/spring-automation/commands/generator/java/javaProjectUtils";
import { editorCommand } from "../../../../handlers/commands/editors/editorCommand";
import { OptionalBranchParameters } from "../support/OptionalBranchParameters";

@Parameters()
export class ApplyHeaderParameters extends OptionalBranchParameters {

    @Parameter({required: false})
    public glob: string = AllJavaFiles;

    @Parameter({required: false})
    public license: "apache" = "apache";

    get header(): string {
        switch (this.license) {
            case "apache" :
                return ApacheHeader;
            default :
                throw new Error(`'${this.license}' is not a supported license`);
        }
    }
}

/* tslint:disable */
export const ApacheHeader = `/*
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
    ApplyHeaderParameters,
    {
        editMode: ahp => new PullRequest(
            ahp.branch || "ah-" + new Date().getTime(),
            `Apply license header (${ahp.license})`,
        ),
    });

export async function applyHeaderProjectEditor(p: Project, ctx: HandlerContext, params: ApplyHeaderParameters) {
    let headersAdded = 0;
    let matchingFiles = 0;
    await doWithFiles(p, params.glob, async f => {
        ++matchingFiles;
        const content = await f.getContent();
        if (content.includes(params.header)) {
            return;
        }
        if (alreadyHasHeader(content)) {
            return ctx.messageClient.respond(`\`${f.path}\` already has a different header`);
        }
        ++headersAdded;
        return f.setContent(params.header + "\n\n" + content);
    });
    await ctx.messageClient.respond(`${matchingFiles} files matched \`${params.glob}\`. ${headersAdded} headers added. ${matchingFiles - headersAdded} files skipped`);
    return p;
}

function alreadyHasHeader(content: string): boolean {
    // TODO this is naive...could match a non license header
    return content.startsWith("/*") && !content.startsWith("/**");
}
