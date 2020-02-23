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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import {
    LeveledLogMethod,
    logger,
} from "@atomist/automation-client/lib/util/logger";
import * as k8s from "@kubernetes/client-node";
import { ExecuteGoalResult } from "../../../../api/goal/ExecuteGoalResult";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { upsertApplication } from "../kubernetes/application";
import {
    isKubernetesApplication,
    KubernetesApplication,
} from "../kubernetes/request";
import { syncApplication } from "../sync/application";
import { getCluster } from "./cluster";
import { getKubernetesGoalEventData } from "./data";
import { appExternalUrls } from "./externalUrls";

/**
 * Given an SdmGoalEvent with the appropriate Kubernetes application
 * data, deploy an application to a Kubernetes cluster.
 *
 * @param goalEvent The Kubernetes deployment goal
 * @param context A standard handler context available from goal executions
 *                or event handlers
 * @param log     SDM goal progress log
 * @return Goal success or failure, with endpoint URL(s) on success if
 *         ingress properties are set
 */
export async function deployApplication(goalEvent: SdmGoalEvent, context: HandlerContext, log: ProgressLog): Promise<ExecuteGoalResult> {
    let appId = deployAppId(goalEvent, context);
    llog(`Processing ${appId}`, logger.debug, log);
    let dest = destination(goalEvent);

    let app: KubernetesApplication;
    try {
        app = getKubernetesGoalEventData(goalEvent);
    } catch (e) {
        return logAndFailDeploy(`No valid goal event data found for ${appId}: ${e.message}`, log, dest);
    }
    dest = destination(goalEvent, app);

    if (!isKubernetesApplication(app)) {
        return logAndFailDeploy(`No valid Kubernetes goal event data found for ${appId}`, log, dest);
    }
    appId = deployAppId(goalEvent, context, app);

    llog(`Deploying ${appId} to Kubernetes`, logger.info, log);
    let resources: k8s.KubernetesObject[];
    try {
        resources = await upsertApplication(app, goalEvent.fulfillment.name);
    } catch (e) {
        return logAndFailDeploy(`Failed to deploy ${appId} to Kubernetes: ${e.message}`, log, dest);
    }
    const message = `Successfully deployed ${appId} to Kubernetes`;
    llog(message, logger.info, log);
    const description = `Deployed \`${dest}\``;
    const externalUrls = await appExternalUrls(app, goalEvent);
    try {
        await syncApplication(app, resources);
    } catch (e) {
        return logAndFailDeploy(`Deployed ${appId} to Kubernetes but failed to update sync repo: ${e.message}`, log, dest);
    }
    return { code: 0, description, externalUrls, message };
}

/** Create a descriptive string for a goal event. */
export function deployAppId(g: SdmGoalEvent, c: HandlerContext, a?: KubernetesApplication): string {
    const app = (a) ? `/${a.ns}/${a.name}` : "";
    return `${c.workspaceId}:${g.repo.owner}/${g.repo.name}:${g.sha}:${g.fulfillment.name}${app}`;
}

/**
 * Log to a specific log level method and a progress log.
 *
 * @param ll Levelled log method like `logger.debug`
 * @param log goal progress log
 */
export function llog(message: string, ll: LeveledLogMethod, log: ProgressLog): void {
    log.write(message);
    ll(message);
}

/**
 * Log and return failure.
 *
 * @param message informative error message
 * @return an ExecuteGoalResult indicating a failed deploy using the provided error message
 */
function logAndFailDeploy(message: string, log: ProgressLog, dest: string): ExecuteGoalResult {
    llog(message, logger.error, log);
    const description = `Deploy \`${dest}\` failed`;
    return { code: 1, description, message };
}

/**
 * Create identifying deployment destination from goal environment and
 * fulillment name using [[getCluster]], application namespace, and
 * application name.
 *
 * @param goalEvent SDM goal event to generate desitnation for
 * @param app Kubernetes application object
 * @return The cluster name, application namespace, and application name
 */
export function destination(goalEvent: SdmGoalEvent, app?: KubernetesApplication): string {
    const cluster = getCluster(goalEvent.environment, goalEvent.fulfillment.name);
    const nsName = (app) ? `:${app.ns}/${app.name}` : "";
    return `${cluster}${nsName}`;
}
