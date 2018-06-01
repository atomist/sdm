/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import * as _ from "lodash";
import { addressChannelsFor } from "../../../../api/context/addressChannels";
import {
    FingerprintDifference,
    FingerprintDifferenceListener,
    FingerprintDifferenceListenerInvocation,
    FingerprintValue,
} from "../../../../api/listener/FingerprintDifferenceListener";
import { CredentialsResolver } from "../../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import * as schema from "../../../../typings/types";

/**
 * React to a PushImpact event to react to semantic diffs
 */
@EventHandler("Find semantic diffs from a PushImpact", subscription("OnPushImpact"))
export class ReactToSemanticDiffsOnPushImpact
    implements HandleEvent<schema.OnPushImpact.Subscription> {

    constructor(private readonly differenceListeners: FingerprintDifferenceListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver) {
    }

    public async handle(event: EventFired<schema.OnPushImpact.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const pushImpact = event.data.PushImpact[0];

        const after = pushImpact.push.after;
        const id = params.repoRefResolver.toRemoteRepoRef(after.repo, { sha: after.sha });

        const oldFingerprints = pushImpact.push.before.fingerprints;
        const newFingerprints = after.fingerprints;

        const oldValues: FingerprintValue[] = oldFingerprints
            .filter(f => !!f.name) as FingerprintValue[];
        const newValues: FingerprintValue[] = newFingerprints
            .filter(f => !!f.name) as FingerprintValue[];

        const allNames = _.uniq(oldValues.map(f => f.name)
            .concat(newValues.map(f => f.name)));

        const diffs: FingerprintDifference[] =
            allNames
                .map(name => ({
                    oldValue: oldValues.find(f => f.name === name),
                    newValue: newValues.find(f => f.name === name),
                }))
                .filter(fv => _.get(fv, "oldValue.sha") !== _.get(fv, "newValue.sha"));

        const credentials = this.credentialsFactory.eventHandlerCredentials(context, id);
        const inv: FingerprintDifferenceListenerInvocation = {
            id,
            context,
            credentials,
            addressChannels: addressChannelsFor(after.repo, context),
            diffs,
        };
        await Promise.all(this.differenceListeners.map(dh => dh(inv)));
        return Success;
    }
}
