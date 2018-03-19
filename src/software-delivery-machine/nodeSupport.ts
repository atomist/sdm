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

import { nodeTagger } from "@atomist/spring-automation/commands/tag/nodeTagger";
import { whenPushSatisfies } from "../blueprint/ruleDsl";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { Install } from "../common/delivery/build/local/npm/NpmBuilder";
import { LocalCommandAutofix } from "../common/delivery/code/autofix/LocalCommandAutofix";
import { IsTypeScript } from "../common/listener/support/tsPushTests";
import { tagRepo } from "../common/listener/tagRepo";
import { asSpawnCommand } from "../util/misc/spawned";
import { AddAtomistTypeScriptHeader } from "./blueprint/code/autofix/addAtomistTypeScriptHeader";
import { applyApacheLicenseHeaderEditor } from "./commands/editors/license/applyHeader";

/**
 * Configuration common to Node SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} softwareDeliveryMachine
 */
export function addNodeSupport(softwareDeliveryMachine: SoftwareDeliveryMachine) {
    softwareDeliveryMachine
        .addEditors(
            () => applyApacheLicenseHeaderEditor,
        )
        // .addGenerators(() => springBootGenerator({
        //     seedOwner: "spring-team",
        //     seedRepo: "spring-rest-seed",
        // }, []))
        .addNewRepoWithCodeActions(
            tagRepo(nodeTagger),
        )
        .addAutofixes(
            AddAtomistTypeScriptHeader,
            new LocalCommandAutofix("tslint",
                whenPushSatisfies(IsTypeScript).itMeans("TypeScript repo"),
                Install,
                asSpawnCommand("npm run lint:fix")),
        );
}
