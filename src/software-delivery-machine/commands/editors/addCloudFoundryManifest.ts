import { HandleCommand } from "@atomist/automation-client";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { editor } from "../../../handlers/commands/editors/registerEditor";
import { identification } from "../../../handlers/events/delivery/build/local/maven/pomParser";

export const AddCloudFoundryManifestEditorName = "AddCloudFoundryManifest";

export const addCloudFoundryManifest: HandleCommand<any> = editor(
    () => addCfManifest,
    AddCloudFoundryManifestEditorName);

export const addCfManifest: SimpleProjectEditor = (p, ctx, params) => {
    return p.findFile("pom.xml")
        .then(pom => pom.getContent()
            .then(content => identification(content))
            .then(ident => {
                return p.addFile("manifest.yml", manifestFor(ident.artifact));
            }))
        .catch(err => p);
};

const manifestFor = name => `---
applications:
- name: ${name}
  memory: 1024M
  instances: 1
  buildpack: https://github.com/cloudfoundry/java-buildpack.git`;
