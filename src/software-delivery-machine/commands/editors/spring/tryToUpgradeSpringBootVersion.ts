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

import { HandleCommand, Parameter, Parameters } from "@atomist/automation-client";
import { setSpringBootVersionEditor } from "@atomist/spring-automation/commands/editor/spring/setSpringBootVersionEditor";
import { UnleashPhilParameters } from "@atomist/spring-automation/commands/editor/spring/unleashPhil";
import { CurrentSpringBootVersion } from "@atomist/spring-automation/commands/reviewer/spring/SpringBootVersionReviewer";
import { EditModeSuggestion } from "../../../../common/command/editor/EditModeSuggestion";
import { dryRunEditor } from "../../../../common/command/generator/dry-run/dryRunEditor";

@Parameters()
export class UpgradeSpringBootParameters implements EditModeSuggestion {

    @Parameter({
        displayName: "Desired Spring Boot version",
        description: "The desired Spring Boot version across these repos",
        pattern: /^.+$/,
        validInput: "Semantic version",
        required: false,
    })
    // TODO this should be in a  object goals
    public desiredBootVersion: string = CurrentSpringBootVersion;

    private readonly guid = "" + new Date().getTime();

    get desiredBranchName() {
        return `boot-upgrade-${this.desiredBootVersion}-${this.guid}`;
    }

    get desiredPullRequestTitle() {
        return `Upgrade Spring Boot version to ${this.desiredBootVersion}`;
    }

    get desiredCommitMessage() {
        return this.desiredPullRequestTitle;
    }
}

/**
 * Wrap Spring Boot set version editor in a dryRunEditor, causing an event
 * handler to respond to the build with either a PR and Issue
 * @type {HandleCommand<EditOneOrAllParameters>}
 */
export const tryToUpgradeSpringBootVersion: HandleCommand = dryRunEditor<UnleashPhilParameters>(
    params => setSpringBootVersionEditor(params.desiredBootVersion),
    UpgradeSpringBootParameters as any,
    "boot-upgrade", {
        description: `Upgrade Spring Boot version`,
        intent: "try to upgrade Spring Boot",
    },
);
