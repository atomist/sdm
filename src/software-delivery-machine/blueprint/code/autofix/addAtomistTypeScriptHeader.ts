
import { AutofixRegistration } from "../../../../common/delivery/code/codeActionRegistrations";
import { IsTypeScript } from "../../../../common/listener/support/tsPushTests";
import { ApplyHeaderParameters, applyHeaderProjectEditor } from "../../../commands/editors/license/applyHeader";

const OurParams = new ApplyHeaderParameters();
OurParams.glob = "**/*.ts";

export const AddAtomistTypeScriptHeader: AutofixRegistration = {
    name: "TypeScript header",
    pushTest: IsTypeScript,
    action: (p, context, params) => applyHeaderProjectEditor(p, context, OurParams),
};
