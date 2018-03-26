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
import { SoftwareDeliveryMachine } from "../../../blueprint/SoftwareDeliveryMachine";
import { tslintFix } from "../../../common/delivery/code/autofix/node/tslint";
import { tagRepo } from "../../../common/listener/support/tagRepo";
import { AddAtomistTypeScriptHeader } from "../../blueprint/code/autofix/addAtomistHeader";
import { nodeGenerator } from "../../commands/generators/node/nodeGenerator";

/**
 * Configuration common to Node SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} softwareDeliveryMachine
 */
export function addNodeSupport(softwareDeliveryMachine: SoftwareDeliveryMachine) {
    softwareDeliveryMachine
        .addGenerators(() => nodeGenerator({
            seedOwner: "spring-team",
            seedRepo: "typescript-express-seed",
            intent: "create node",
        }))
        .addGenerators(() => nodeGenerator({
            seedOwner: "spring-team",
            seedRepo: "minimal-node-seed",
            intent: "create minimal node",
        }))
        .addNewRepoWithCodeActions(
            tagRepo(nodeTagger),
        )
        .addAutofixes(
            AddAtomistTypeScriptHeader,
            tslintFix,
        );
}
