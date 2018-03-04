import { HandleCommand, logger } from "@atomist/automation-client";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { editor } from "../../../../handlers/commands/editors/registerEditor";
import { deploymentTemplate } from "./deploymentTemplate";

export const AddK8sSpecCommandName = "AddK8sSpecCommandName";

export const AtomistK8sSpecFile = "atomist-k8s-deployment.json";

export const ImagePlaceholder = "image_placeholder";

export const addK8sSpec: HandleCommand<any> = editor(
    () => addK8sSpecEditor,
    AddK8sSpecCommandName, {
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
