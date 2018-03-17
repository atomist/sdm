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

import { HandleCommand } from "@atomist/automation-client";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { identification } from "../../../../common/delivery/build/local/maven/pomParser";
import { CloudFoundryManifestPath } from "../../../../common/delivery/deploy/pcf/CloudFoundryTarget";
import { editorCommand, EmptyParameters } from "../../../../handlers/commands/editors/editorCommand";

export const AddCloudFoundryManifestCommandName = "AddCloudFoundryManifest";

/**
 * Command handler wrapping addCloudFoundryManifest editor
 * @type {HandleCommand<EditOneOrAllParameters>}
 */
export const addCloudFoundryManifest: HandleCommand = editorCommand(
    () => addCloudFoundryManifestEditor,
    AddCloudFoundryManifestCommandName,
    EmptyParameters,
    {
        intent: "Add Cloud Foundry manifest",
        editMode: () => new PullRequest(
            `add-pcf-manifest-${new Date().getTime()}`,
            "Add Cloud Foundry manifest",
            "This will trigger the Software Development Machine to deploy to your Cloud Foundry space",
            "Add Cloud Foundry manifest\n\n[atomist]"),
    });

// We know that there's a POM if this get invoked
export const addCloudFoundryManifestEditor: SimpleProjectEditor = async (p, ctx) => {
    const pom = await p.findFile("pom.xml");
    const content = await pom.getContent();
    const ident = await identification(content);
    return p.addFile(CloudFoundryManifestPath, javaManifestFor(ident.artifact, ctx.teamId));
};

// Simple template for Cloud Foundry manifest
const javaManifestFor = (name, teamId) => `---
applications:
- name: ${name}
  memory: 1024M
  instances: 1
  buildpack: https://github.com/cloudfoundry/java-buildpack.git
  env:
    ATOMIST_TEAM: ${teamId}`;
