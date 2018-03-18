
import { AutofixRegistration } from "../../../../common/delivery/code/codeActionRegistrations";
import { IsTypeScript } from "../../../../common/listener/support/tsPushTests";
import { ApplyHeaderParameters, applyHeaderProjectEditor } from "../../../commands/editors/license/applyHeader";

const OurParams = new ApplyHeaderParameters();
OurParams.glob = "**/*.ts";

export const AddAtomistTypeScriptHeader: AutofixRegistration = {
    name: "TypeScript header",
    pushTest: IsTypeScript,
    // Ignored any parameters passed in, which will be undefined in an autofix, and provide predefined parameters
    action: (p, context) => applyHeaderProjectEditor(p, context, OurParams),
};
