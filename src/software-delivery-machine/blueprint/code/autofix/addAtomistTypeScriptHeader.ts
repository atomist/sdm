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
