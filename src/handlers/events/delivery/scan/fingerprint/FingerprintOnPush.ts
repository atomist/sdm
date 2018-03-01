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
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as schema from "../../../../../typings/types";
import { sendFingerprint } from "../../../../../util/webhook/sendFingerprint";

import * as _ from "lodash";
import { Fingerprinter } from "../../../../../common/listener/Fingerprinter";

/**
 * Fingerprint on any push
 */
@EventHandler("On repo creation",
    GraphQL.subscriptionFromFile("graphql/subscription/OnAnyPush.graphql"))
export class FingerprintOnPush
    implements HandleEvent<schema.OnAnyPush.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private fingerprinters: Fingerprinter[]) {
    }

    public async handle(event: EventFired<schema.OnAnyPush.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const push = event.data.Push[0];
        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, push.after.sha);
        const project = await GitCommandGitProject.cloned({ token: params.githubToken}, id);
        const fingerprints: Fingerprint[] = await Promise.all(
            params.fingerprinters.map(async fp => {
                const f = await fp(project);
                return isFingerprint(f) ? [f] : f;
            }),
        ).then(x2 => _.flatten(x2));
        await fingerprints.map(fingerprint => sendFingerprint(id, fingerprint, ctx.teamId));
        return Success;
    }
}

function isFingerprint(a: any): a is Fingerprint {
    const fq = a as Fingerprint;
    return !!fq.sha && !!fq.version;
}
