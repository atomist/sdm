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

import { GoalExecutionListener } from "../../api/listener/GoalStatusListener";
import {
    CustomSkillOutputInput,
    IngestSkillOutputMutation,
    IngestSkillOutputMutationVariables,
    SdmGoalState,
} from "../../typings/types";
import {
    CacheEntry,
    CacheOutputGoalDataKey,
} from "./cache/goalCaching";

/**
 * GoalExecutionListener implementation that raises SkillOutput entities for persistent goal caches
 * that carry a type property
 */
export const SkillOutputGoalExecutionListener: GoalExecutionListener = async gi => {
    const { goalEvent, context, configuration, result, error } = gi;

    // Check that the goal is successful
    if (!!error) {
        return;
    } else if (!!result && (result.code !== 0 || result.state === SdmGoalState.failure)) {
        return;
    } else if (goalEvent.state === SdmGoalState.failure) {
        return;
    }

    const data = JSON.parse(goalEvent.data || "{}");
    const entries: Array<CacheEntry & { type: string, uri: string }> = data[CacheOutputGoalDataKey] || [];

    for (const entry of entries.filter(e => !!e.type && !!e.classifier && !!e.uri)) {
        const skillOutput: CustomSkillOutputInput = {
            _branch: goalEvent.branch,
            _sha: goalEvent.sha,
            _owner: goalEvent.repo.owner,
            _repo: goalEvent.repo.name,
            orgParentId: goalEvent.push.repo.org.id,
            repoParentId: goalEvent.push.repo.id,
            classifier: entry.classifier.slice(`${context.workspaceId}/`.length),
            type: entry.type,
            uri: entry.uri,
            correlationId: context.correlationId,
            skill: {
                name: configuration.name,
                version: configuration.version,
            },
        };
        await context.graphClient.mutate<IngestSkillOutputMutation, IngestSkillOutputMutationVariables>({
            name: "IngestSkillOutput",
            variables: {
                output: skillOutput,
            },
        });
    }
};
