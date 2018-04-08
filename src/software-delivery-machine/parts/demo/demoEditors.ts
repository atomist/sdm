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

import { SoftwareDeliveryMachine } from "../../../blueprint/SoftwareDeliveryMachine";
import { affirmationEditor } from "../../commands/editors/demo/affirmationEditor";
import { breakJavaBuildEditor, unbreakJavaBuildEditor } from "../../commands/editors/demo/breakJavaBuild";
import { breakNodeBuildEditor, unbreakNodeBuildEditor } from "../../commands/editors/demo/breakNodeBuild";
import { javaAffirmationEditor } from "../../commands/editors/demo/javaAffirmationEditor";
import { whackHeaderEditor } from "../../commands/editors/demo/removeTypeScriptHeader";
import { removeFileEditor } from "../../commands/editors/helper/removeFile";

/**
 * Editors for use in demos
 * @param {SoftwareDeliveryMachine} softwareDeliveryMachine
 */
export function addDemoEditors(softwareDeliveryMachine: SoftwareDeliveryMachine) {
    softwareDeliveryMachine
        .addEditors(
            () => affirmationEditor,
            () => breakJavaBuildEditor,
            () => unbreakJavaBuildEditor,
            () => breakNodeBuildEditor,
            () => unbreakNodeBuildEditor,
            () => javaAffirmationEditor,
            () => removeFileEditor,
            () => whackHeaderEditor,
        );
}
