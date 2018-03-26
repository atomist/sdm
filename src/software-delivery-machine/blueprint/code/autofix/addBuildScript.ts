import { AutofixRegistration } from "../../../../common/delivery/code/codeActionRegistrations";
import { IsNode } from "../../../../common/listener/support/pushtest/node/nodePushTests";
import { Project } from "@atomist/automation-client/project/Project";
import { HandlerContext } from "@atomist/automation-client";
import { doWithJson } from "@atomist/automation-client/project/util/jsonUtils";
import * as _ from "lodash"

export const AddBuildScript: AutofixRegistration = {
    name: "Make sure there is a build script",
    pushTest: IsNode,
    action: (p, context) => addBuildScriptEditor(p, context),
};

export async function addBuildScriptEditor(p: Project,
                                           ctx: HandlerContext): Promise<Project> {
    return doWithJson(p, "package.json", (packageJson => {
            if (_.get(packageJson, "scripts.build")) {
                return;
            }
            // todo: what would work on both linuxy and windows?
            return _.merge(packageJson, {scripts: { build: "echo 'The build goes here'" }});
        }
    ));
}