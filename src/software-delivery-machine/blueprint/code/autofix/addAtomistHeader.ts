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

import {
    AutofixRegistration,
    editorAutofixRegistration,
} from "../../../../common/delivery/code/autofix/AutofixRegistration";
import { PushTest } from "../../../../common/listener/PushTest";
import { hasFileContaining } from "../../../../common/listener/support/pushtest/commonPushTests";
import { IsJava } from "../../../../common/listener/support/pushtest/jvm/jvmPushTests";
import { IsTypeScript } from "../../../../common/listener/support/pushtest/node/tsPushTests";
import { allSatisfied } from "../../../../common/listener/support/pushtest/pushTestUtils";
import { AddHeaderParameters, addHeaderProjectEditor } from "../../../commands/editors/license/addHeader";
import { LicenseFilename } from "./addLicenseFile";

export const AddAtomistJavaHeader: AutofixRegistration = addAtomistHeader("Java header", "**/*.java", IsJava);

export const AddAtomistTypeScriptHeader: AutofixRegistration = addAtomistHeader("TypeScript header", "**/*.ts", IsTypeScript);

export function addAtomistHeader(name: string, glob: string, pushTest: PushTest): AutofixRegistration {
    const parameters = new AddHeaderParameters();
    parameters.glob = glob;
    return editorAutofixRegistration({
        name,
        pushTest: allSatisfied(pushTest, hasFileContaining(LicenseFilename, /Apache License/)),
        // Ignored any parameters passed in, which will be undefined in an autofix, and provide predefined parameters
        editor: addHeaderProjectEditor,
        parameters,
    });
}
