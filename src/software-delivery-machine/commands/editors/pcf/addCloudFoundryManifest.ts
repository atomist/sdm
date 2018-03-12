import { HandleCommand } from "@atomist/automation-client";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { editor } from "../../../../handlers/commands/editors/registerEditor";
import { identification } from "../../../../handlers/events/delivery/build/local/maven/pomParser";
import { CloudFoundryManifestPath } from "../../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";

export const AddCloudFoundryManifestCommandName = "AddCloudFoundryManifest";

export const addCloudFoundryManifest: HandleCommand<any> = editor(
    () => addCfManifest,
    AddCloudFoundryManifestCommandName, {
        intent: "Add Cloud Foundry manifest",
        editMode: () => new PullRequest(
            `add-pcf-manifest-${new Date().getTime()}`,
            "Add Cloud Foundry manifest",
            "This will trigger the Software Development Machine to deploy to your Cloud Foundry space",
            "Add Cloud Foundry manifest\n\n[atomist]"),
    });

// We know that there's a POM if this get invoked
export const addCfManifest: SimpleProjectEditor = async (p, ctx) => {
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
