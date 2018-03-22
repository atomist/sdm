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
    ingester,
    IngesterBuilder,
    type,
} from "@atomist/automation-client";

export const DeployEnablementRootType = "SdmDeployEnablement";

export interface DeployEnablement {
    state: "requested" | "disabled";
    owner: string;
    repo: string;
    providerId: string;
}

export const DeployEnablementIngester: IngesterBuilder = ingester(DeployEnablementRootType)
    .withType(type(DeployEnablementRootType)
        .withStringField(
            "owner",
            "The name of the repo owner (org or user)",
            ["compositeId"])
        .withStringField(
            "repo",
            "The name of the repo",
            ["compositeId"])
        .withStringField(
            "providerId",
            "The internal providerId of the org/repo",
            ["compositeId"])
        .withStringField(
            "state",
            "State of deploy enablement (requested or disabled)"));
