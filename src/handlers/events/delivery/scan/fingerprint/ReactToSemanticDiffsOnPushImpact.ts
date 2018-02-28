/*
 * Copyright © 2017 Atomist, Inc.
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

import * as _ from "lodash";

import { GraphQL, Secret, Secrets } from "@atomist/automation-client";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    FingerprintDifference,
    FingerprintDifferenceInvocation, FingerprintDifferenceListener,
    FingerprintValue,
} from "../../../../../common/listener/FingerprintDifferenceListener";
import { addressChannelsFor } from "../../../../../common/slack/addressChannels";
import * as schema from "../../../../../typings/types";

/**
 * React to a PushImpact event to react to semantic diffs
 */
@EventHandler("Find semantic diffs from a PushImpact",
    GraphQL.subscriptionFromFile("graphql/subscription/OnPushImpact.graphql"))
export class ReactToSemanticDiffsOnPushImpact
    implements HandleEvent<schema.OnPushImpact.Subscription> {

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    private githubToken: string;

    constructor(private differenceListeners: FingerprintDifferenceListener[]) {
    }

    public async handle(event: EventFired<schema.OnPushImpact.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const pushImpact = event.data.PushImpact[0];

        const after = pushImpact.push.after;
        const id = new GitHubRepoRef(after.repo.owner, after.repo.name, after.sha);

        const oldFingerprints = pushImpact.push.before.fingerprints;
        const newFingerprints = after.fingerprints;

        const oldValues: FingerprintValue[] = oldFingerprints
            .filter(f => !!f.name) as FingerprintValue[];
        const newValues: FingerprintValue[] = newFingerprints
            .filter(f => !!f.name) as FingerprintValue[];

        const allNames = _.uniq(oldValues.map(f => f.name)
            .concat(newValues.map(f => f.name)));

        const diffs: FingerprintDifference[] =
            allNames.map(name => ({
                oldValue: oldValues.find(f => f.name === name),
                newValue: newValues.find(f => f.name === name),
            }))
                .filter(fv => _.get(fv, "oldValue.sha") !== _.get(fv, "newValue.sha"));

        const inv: FingerprintDifferenceInvocation = {
            id,
            context,
            credentials: {token: params.githubToken},
            addressChannels: addressChannelsFor(after.repo, context),
            diffs,
        };
        await Promise.all(this.differenceListeners.map(dh => dh(inv)));
        return Success;
    }
}
