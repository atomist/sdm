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
    AutomationContextAware,
    HandlerContext,
    HandlerResult,
} from "@atomist/automation-client";
import { automationClientInstance } from "@atomist/automation-client/automationClient";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import * as fs from "fs-extra";
import * as path from "path";
import { StringCapturingProgressLog } from "../../../../../common/log/StringCapturingProgressLog";
import {
    OnAnyRequestedSdmGoal,
    ProgressLog,
} from "../../../../../index";
import { SdmGoal } from "../../../../../ingesters/sdmGoalIngester";
import { spawnAndWatch } from "../../../../../util/misc/spawned";

/**
 * Launch a goal as a kubernetes job
 * @param {OnAnyRequestedSdmGoal.SdmGoal} goal
 * @param {HandlerContext} ctx
 * @param {ProgressLog} progressLog
 * @returns {Promise<HandlerResult>}
 * @constructor
 */
export const KubernetesIsolatedGoalLauncher = async (goal: OnAnyRequestedSdmGoal.SdmGoal,
                                                     ctx: HandlerContext,
                                                     progressLog: ProgressLog): Promise<HandlerResult> => {
    const deploymentName = process.env.ATOMIST_DEPLOYMENT_NAME || automationClientInstance().configuration.name;
    const deploymentNamespace = process.env.ATOMIST_DEPLOYMENT_NAMESPACE || "default";

    const log = new StringCapturingProgressLog();

    const spec = await spawnAndWatch({
            command: "kubectl",
            args: ["get", "deployment", deploymentName, "-n", deploymentNamespace, "-o", "json"],
        },
        {},
        log,
        {
            errorFinder: code => code !== 0,
        },
    );

    if (spec.code !== 0) {
        return spec;
    }

    const jobSpec = JSON.parse(JobSpec);
    const containerSpec = JSON.parse(log.log).spec.template.spec;
    jobSpec.spec.template.spec = containerSpec;

    jobSpec.metadata.name =
        `${deploymentName}-job-${goal.goalSetId.slice(0, 7)}-${goal.uniqueName.toLocaleLowerCase()}`;
    jobSpec.metadata.namespace = deploymentNamespace;
    jobSpec.spec.template.spec.restartPolicy = "Never";
    jobSpec.spec.template.spec.containers[0].name = jobSpec.metadata.name;
    jobSpec.spec.template.spec.containers[0].env.push({
            name: "ATOMIST_GOAL_TEAM",
            value: ctx.teamId,
        },
        {
            name: "ATOMIST_GOAL_TEAM_NAME",
            value: (ctx as any as AutomationContextAware).context.teamName,
        },
        {
            name: "ATOMIST_GOAL_ID",
            value: goal.id,
        },
        {
            name: "ATOMIST_CORRELATION_ID",
            value: ctx.correlationId,
        },
        {
            name: "ATOMIST_ISOLATED_GOAL",
            value: "true",
        });

    const tempfile = require("tempfile")(".json");
    await fs.writeFile(tempfile, JSON.stringify(jobSpec, null, 2));

    // TODO CD the following code needs to be replaced with proper job scheduling via k8-automation
    return spawnAndWatch({
            command: "kubectl",
            args: ["apply", "-f", tempfile],
        },
        {},
        progressLog,
        {
            errorFinder: code => code !== 0,
        },
    );

    // query kube to make sure the job got scheduled
    // kubectl get job <jobname> -o json
};

const JobSpec = `{
    "kind" : "Job",
    "apiVersion" : "batch/v1",
    "metadata" : {
      "name" : "sample-sdm-job",
      "namespace" : "default"
    },
    "spec" : {
      "template" : {
        "spec" : {
          "containers" : []
        }
      }
    }
  }`;

export interface KubernetesOptions {
    name: string;
    environment: string;

    ns?: string;
    imagePullSecret?: string;
    port?: number;
    path?: string;
    host?: string;
    protocol?: string;
}

/**
 * Sets kubernetes deployment specific data to an SdmGoal
 * @param {SdmGoal} goal
 * @param {KubernetesOptions} options
 * @param {GitProject} p
 * @returns {Promise<SdmGoal>}
 */
export async function createKubernetesData(goal: SdmGoal, options: KubernetesOptions, p: GitProject): Promise<SdmGoal> {
    const deploymentSpec = await readKubernetesSpec(p, "deployment.json");
    const serviceSpec = await readKubernetesSpec(p, "service.json");
    return {
        ...goal,
        data: JSON.stringify({
            kubernetes: {
                ...options,
                deploymentSpec,
                serviceSpec,
            },
        }),
    };
}

async function readKubernetesSpec(p: GitProject, name: string): Promise<string> {
    const specPath = path.join(".atomist", "kubernetes", name);
    if (p.fileExistsSync(specPath)) {
        return (await p.getFile(specPath)).getContent();
    } else {
        return undefined;
    }
}
