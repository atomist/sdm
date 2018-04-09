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
import { MavenProjectIdentifier } from "../../../../common/delivery/build/local/maven/pomParser";
import { NodeProjectIdentifier } from "../../../../common/delivery/build/local/npm/nodeProjectIdentifier";
import { CloudFoundryManifestPath } from "../../../../common/delivery/deploy/pcf/CloudFoundryTarget";
import { HasSpringBootPom } from "../../../../common/listener/support/pushtest/jvm/springPushTests";

export const AddCloudFoundryManifestCommandName = "AddCloudFoundryManifest";
export const AddCloudFoundryManifestMarker = "[atomist:add-pcf-manifest]";

// Using this marker removes some buttons on the Pull Request
export const AtomistGeneratedMarker = "[atomist:generated]";

export const AtomistConfigTsPath = "src/atomist.config.ts";

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
            `This will trigger the Software Development Machine to deploy to your Cloud Foundry space.

${AtomistGeneratedMarker}`,
            `Add Cloud Foundry manifest

${AddCloudFoundryManifestMarker}`),
    });

// This should not have been invoked unless it's a Spring or Node project
export const addCloudFoundryManifestEditor: SimpleProjectEditor = async (p, ctx) => {
    const javaId = await MavenProjectIdentifier(p);
    if (javaId && await HasSpringBootPom.predicate(p)) {
        return p.addFile(CloudFoundryManifestPath, javaManifestFor(javaId.name, ctx.teamId));
    }
    const nodeId = await NodeProjectIdentifier(p);
    if (nodeId) {
        const isAutomationClient = !!await p.getFile(AtomistConfigTsPath);
        logger.info(`addCloudFoundryManifestEditor: Node project %j: automation client=${isAutomationClient}`, p.id);
        return p.addFile(CloudFoundryManifestPath,
            isAutomationClient ?
                automationClientManifestFor(nodeId.name, ctx.teamId) :
                nodeManifestFor(nodeId.name, ctx.teamId))
            .then(() => p.addFile(".cfignore", "node_modules/"));
    }
    return ctx.messageClient.respond(
        `Unable to add Cloud Foundry manifest to project \`${p.id.owner}:${p.id.repo}\`: Neither Maven nor Node`);
};

// Simple template for Cloud Foundry manifest
const javaManifestFor = (name, teamId) => `---
applications:
- name: "${name}"
  memory: 1024M
  instances: 1
  buildpack: https://github.com/cloudfoundry/java-buildpack.git
  env:
    ATOMIST_TEAM: ${teamId}`;

const nodeManifestFor = (name, teamId) => `---
applications:
- name: "${name}"
  memory: 512M
  instances: 1
  buildpack: https://github.com/cloudfoundry/nodejs-buildpack
  env:
    ATOMIST_TEAMS: ${teamId}`;

// tslint:disable-next-line:max-line-length
export const StartAutomationClientCommand = "node --trace-warnings --expose_gc --optimize_for_size --always_compact --max_old_space_size=384 node_modules/@atomist/automation-client/start.client.js";

/* tslint:disable:max-line-length */
// dd: The poorly names "max_old_space_size" seems to map roughly to heap,
// so you want your container limit to be 15-25% higher than whatever you set the max_old_space_size to.
const automationClientManifestFor = (name, teamId) => `---
applications:
- name: ${name}
  command: "${StartAutomationClientCommand}"
  memory: 512M
  buildpack: https://github.com/cloudfoundry/nodejs-buildpack
  env:
    SUPPRESS_NO_CONFIG_WARNING: true
    ATOMIST_TEAMS: ${teamId}`;
