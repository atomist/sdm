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

import { HandleCommand, logger } from "@atomist/automation-client";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { editorCommand } from "../../../../common/command/editor/editorCommand";
import { EmptyParameters } from "../../../../common/command/EmptyParameters";
import { deploymentTemplate } from "./deploymentTemplate";

export const AddK8sSpecCommandName = "AddK8sSpecCommandName";

export const AtomistK8sSpecFile = "atomist-k8s-deployment.json";

export const ImagePlaceholder = "image_placeholder";

export const addK8sSpec: HandleCommand = editorCommand(
    () => addK8sSpecEditor,
    AddK8sSpecCommandName,
    EmptyParameters,
    {
        intent: "Add kubernetes deployment spec",
        editMode: () => new PullRequest("enable-k8s",
            "Enable deployment to Kubernetes",
            `This will trigger the Software Development Machine to request deployment of this service in a Kubernetes environment.

The Atomist playground kubernetes environment is restricted, so changes to this file will not change anything there.
In your own kubernetes environment, you can do what you like; see https://github.com/atomist/k8-automation for a starting point.`,
            "Enable deployment to kubernetes\n\n[atomist]"),
    });

export const addK8sSpecEditor: SimpleProjectEditor = async (p, ctx) => {
    const specFileContent = deploymentTemplate(p.id.repo, p.id.owner, p.id.repo,
        ctx.teamId, ImagePlaceholder, "testing");
    logger.debug("Spec file content is \n" + specFileContent);
    return p.addFile(AtomistK8sSpecFile, specFileContent);
};
