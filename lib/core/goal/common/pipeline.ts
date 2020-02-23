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

import { logger } from "@atomist/automation-client/lib/util/logger";
import { testProgressReporter } from "../../../api-helper/goal/progress/progress";
import {
    doWithProject,
    ProjectAwareGoalInvocation,
} from "../../../api-helper/project/withProject";
import { ExecuteGoalResult } from "../../../api/goal/ExecuteGoalResult";
import {
    FulfillableGoalDetails,
    goal,
    GoalWithFulfillment,
} from "../../../api/goal/GoalWithFulfillment";
import { SdmGoalState } from "../../../typings/types";

const PipelineProgressReporter = testProgressReporter({
    test: /Running step '(.*)'/i,
    phase: "$1",
});

/**
 * Single step in the Goal pipeline execution
 */
export interface PipelineStep<G extends Record<string, any> = any> {
    /** Name of the step */
    name: string;
    /** Function that gets called when the step should execute */
    run: (gi: ProjectAwareGoalInvocation, context: G) => Promise<void | ExecuteGoalResult>;
    /** Optional function to indicate if the step should run */
    runWhen?: (gi: ProjectAwareGoalInvocation) => Promise<boolean>;
}

/**
 * Execute provided pipeline steps in the order they are provided or until one fails
 */
export async function runPipeline(gi: ProjectAwareGoalInvocation, ...steps: PipelineStep[]): Promise<void | ExecuteGoalResult> {
    const { progressLog } = gi;
    const context: Record<string, any> = {};

    for (const step of steps) {
        try {
            if (!step.runWhen || !!(await step.runWhen(gi))) {
                progressLog.write(`Running step '${step.name}'`);

                const result = await step.run(gi, context);
                if (!!result && (result.code !== 0 || result.state !== SdmGoalState.failure)) {
                    return result;
                }
            } else {
                progressLog.write(`Skipping step '${step.name}'`);
            }
        } catch (e) {
            logger.warn(`Step '${step.name}' errored with:`);
            logger.warn(e);
            return {
                state: SdmGoalState.failure,
                phase: step.name,
            };
        }
    }
}

/**
 * Goal that executes the provided pipeline steps
 */
export function pipeline(details: FulfillableGoalDetails, ...steps: PipelineStep[]): GoalWithFulfillment {
    return goal(
        details,
        doWithProject(async gi => {
            return runPipeline(gi, ...steps);
        }, { readOnly: false, detachHead: true }),
        { progressReporter: PipelineProgressReporter });
}
