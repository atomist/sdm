import { HandleCommand } from "@atomist/automation-client";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { editor } from "../../../handlers/commands/editors/registerEditor";
import { identification } from "../../../handlers/events/delivery/build/local/maven/pomParser";
import { CloudFoundryManifestPath } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";

export const AddK8sSpecCommandName = "AddK8sSpecCommandName";

export const addK8sSpec: HandleCommand<any> = editor(
    () => addK8sSpecEditor,
    AddK8sSpecCommandName);

export const addK8sSpecEditor: SimpleProjectEditor = (p, ctx) => {
    return p.findFile("pom.xml")
        .then(pom => pom.getContent()
            .then(content => identification(content))
            .then(ident => {
                return p.addFile("k8.json", k8sSpec(ident.artifact, ctx.teamId));
            }))
        .catch(err => p);
};

const k8sSpec = (name, teamId) => `---
thing`;
