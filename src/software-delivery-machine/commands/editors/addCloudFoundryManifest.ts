import { HandleCommand } from "@atomist/automation-client";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { editor } from "../../../handlers/commands/editors/registerEditor";
import { identification } from "../../../handlers/events/delivery/build/local/maven/pomParser";
import { ManifestPath } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";

export const AddCloudFoundryManifestEditorName = "AddCloudFoundryManifest";

export const addCloudFoundryManifest: HandleCommand<any> = editor(
    () => addCfManifest,
    AddCloudFoundryManifestEditorName);

export const addCfManifest: SimpleProjectEditor = (p, ctx) => {
    return p.findFile("pom.xml")
        .then(pom => pom.getContent()
            .then(content => identification(content))
            .then(ident => {
                return p.addFile(ManifestPath, javaManifestFor(ident.artifact, ctx.teamId));
            }))
        .catch(err => p);
};

const javaManifestFor = (name, teamId) => `---
applications:
- name: ${name}
  memory: 1024M
  instances: 1
  buildpack: https://github.com/cloudfoundry/java-buildpack.git
  env:
    ATOMIST_TEAM: ${teamId}`;
