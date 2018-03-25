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

import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { ProjectListenerInvocation } from "../../../common/listener/Listener";
import { AddCloudFoundryManifestCommandName } from "../../commands/editors/pcf/addCloudFoundryManifest";
import { PushTest } from "../../../common/listener/PushTest";
import { allSatisfied, anySatisfied } from "../../../common/listener/support/pushtest/pushTestUtils";
import { HasSpringBootApplicationClass, IsMaven } from "../../../common/listener/support/pushtest/jvm/jvmPushTests";
import { IsNode } from "../../../common/listener/support/pushtest/node/nodePushTests";
import { logger } from "@atomist/automation-client";

/**
 * PushTest to determine whether we know how to deploy a project
 * @type {PushTest}
 */
const CloudFoundryDeployableProject: PushTest =
    anySatisfied(
        allSatisfied(IsMaven, HasSpringBootApplicationClass),
        IsNode);

export async function suggestAddingCloudFoundryManifest(inv: ProjectListenerInvocation) {
    const eligible = (await CloudFoundryDeployableProject.valueForPush(inv)) === true;
    if (!eligible) {
        logger.info("Not suggesting Cloud Foundry manifest for %j as we don't know how to deploy yet", inv.id);
        return;
    }

    const attachment: slack.Attachment = {
            text: "Add a Cloud Foundry manifest to your new repo?",
            fallback: "add PCF manifest",
            actions: [buttonForCommand({text: "Add Cloud Foundry Manifest"},
                AddCloudFoundryManifestCommandName,
                {"targets.owner": inv.id.owner, "targets.repo": inv.id.repo},
            ),
            ],
        };
    const message: slack.SlackMessage = {
        attachments: [attachment],
    };
    return inv.addressChannels(message);
}
