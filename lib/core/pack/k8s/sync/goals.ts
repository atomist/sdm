/*
 * Copyright © 2020 Atomist, Inc.
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

import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { execPromise } from "@atomist/automation-client/lib/util/child_process";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import { minimalClone } from "../../../../api-helper/goal/minimalClone";
import { LogSuppressor } from "../../../../api-helper/log/logInterpreters";
import { whenPushSatisfies } from "../../../../api/dsl/goalDsl";
import { ExecuteGoalResult } from "../../../../api/goal/ExecuteGoalResult";
import { ExecuteGoal } from "../../../../api/goal/GoalInvocation";
import { goals } from "../../../../api/goal/Goals";
import { GoalWithFulfillment } from "../../../../api/goal/GoalWithFulfillment";
import { IndependentOfEnvironment } from "../../../../api/goal/support/environment";
import { SoftwareDeliveryMachine } from "../../../../api/machine/SoftwareDeliveryMachine";
import {
    pushTest,
    PushTest,
} from "../../../../api/mapping/PushTest";
import { isInLocalMode } from "../../../internal/machine/modes";
import {
    KubernetesSyncOptions,
    SyncRepoRef,
} from "../config";
import { errMsg } from "../support/error";
import { changeResource } from "./change";
import { diffPush } from "./diff";
import { isRemoteRepo } from "./repo";
import { commitTag } from "./tag";

export function isSyncRepoCommit(sdm: SoftwareDeliveryMachine): PushTest | undefined {
    const syncOptions: KubernetesSyncOptions = _.get(sdm, "configuration.sdm.k8s.options.sync");
    if (!syncOptions || !syncOptions.repo) {
        logger.debug(`SDM configuration contains no sync repo, will not create sync repo push test`);
        return undefined;
    }
    return pushTest("IsSyncRepoCommit", async p => {
        const repo: SyncRepoRef | RemoteRepoRef = _.get(sdm, "configuration.sdm.k8s.options.sync.repo");
        if (!isRemoteRepo(repo) && !isInLocalMode()) {
            throw new Error(`SyncRepoRef did not get converted to proper RemoteRepoRef at startup: ${stringify(repo)}`);
        }
        if (isInLocalMode() || (p.id.providerType === (repo as RemoteRepoRef).providerType) &&
            p.id.owner === repo.owner &&
            p.id.repo === repo.repo && p.id.branch === repo.branch) {
            const tag = commitTag(sdm.configuration);
            return p.push.commits.some(c => !c.message.includes(tag));
        }
        return false;
    });
}

/**
 * Add goals for pushes on the sync repo.
 */
export function syncGoals(sdm: SoftwareDeliveryMachine): SoftwareDeliveryMachine {
    const syncRepoPushTest = isSyncRepoCommit(sdm);
    if (!syncRepoPushTest) {
        logger.debug(`No sync repo push test, not adding sync repo goals`);
        return sdm;
    }
    const sync = new GoalWithFulfillment({
        uniqueName: "sync",
        environment: IndependentOfEnvironment,
        displayName: "sync",
        workingDescription: "Syncing",
        completedDescription: "Synced",
        failedDescription: "Sync failed",
        isolated: true,
    }).with({
        name: "K8sSyncRepo",
        goalExecutor: K8sSync,
        logInterpreter: LogSuppressor,
    });
    const syncGoalSet = goals("Sync Kubernetes Resources").plan(sync);
    sdm.addGoalContributions(whenPushSatisfies(syncRepoPushTest).setGoals(syncGoalSet));
    return sdm;
}

/**
 * Create resources of added specs, update resources of changed specs,
 * and remove resources of deleted specs.
 */
export const K8sSync: ExecuteGoal = async gi => {
    const push = gi.goalEvent.push;
    const log = gi.progressLog;
    const params = {
        cloneOptions: minimalClone(push),
        context: gi.context,
        credentials: gi.credentials,
        id: gi.id,
        log,
        readOnly: true,
    };
    const tag = commitTag(gi.configuration);
    return gi.configuration.sdm.projectLoader.doWithProject<ExecuteGoalResult>(params, async p => {
        if (params.cloneOptions.depth > 1) {
            // work around https://github.com/atomist/sdm/issues/729
            try {
                await execPromise("git", ["fetch", `--depth=${params.cloneOptions.depth}`], { cwd: p.baseDir });
            } catch (e) {
                logger.warn(`Failed to undo shallow clone, proceeding anyway: ${e.message}`);
            }
        }
        const changes = await diffPush(p, push, tag, log);
        const errs: Error[] = [];
        for (const change of changes) {
            const verb = (change.change === "delete") ? "Deleting" : "Applying";
            log.write(`${verb} '${change.path}' from commit ${change.sha}`);
            try {
                await changeResource(p, change);
            } catch (e) {
                e.message = `Failed to ${change.change} '${change.path}' resource for commit ${change.sha}: ${errMsg(e)}`;
                log.write(e.message);
                errs.push(e);
            }
        }
        if (errs.length > 0) {
            return { code: errs.length, message: errs.map(e => e.message).join("; ") };
        }
        const message = `Changed ${changes.length} resources`;
        log.write(message);
        return { code: 0, message };
    });
};
