import { HandleCommand, logger } from "@atomist/automation-client";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { editor } from "../../../../handlers/commands/editors/registerEditor";
import { deploymentTemplate } from "./deploymentTemplate";

export const AddK8sSpecCommandName = "AddK8sSpecCommandName";

export const AtomistK8sSpecFile = "atomist-k8s-deployment.json";

export const ImagePlaceholder = "image_placeholder";

export const addK8sSpec: HandleCommand<any> = editor(
    () => addK8sSpecEditor,
    AddK8sSpecCommandName);

export const addK8sSpecEditor: SimpleProjectEditor = async (p, ctx) => {
    const specFileContent = deploymentTemplate(p.id.repo, p.id.owner, p.id.repo,
        ctx.teamId, ImagePlaceholder, "testing");
    logger.debug("Spec file content is \n" + specFileContent);
    return p.addFile(AtomistK8sSpecFile, specFileContent);
};
