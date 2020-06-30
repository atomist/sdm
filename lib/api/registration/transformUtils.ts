/*
 * Copyright © 2019 Atomist, Inc.
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

import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { GoalProjectListenerEvent, GoalProjectListenerRegistration } from "../goal/GoalInvocation";
import { PushTest } from "../mapping/PushTest";
import { AnyPush } from "../mapping/support/commonPushTests";
import { CodeTransform, TransformResult, TransformReturnable } from "./CodeTransform";

function isTransformResult(tr: TransformReturnable): tr is TransformResult {
    const maybe = tr as TransformResult;
    return maybe && maybe.success !== undefined;
}

/**
 * Convert a CodeTransform to a GoalProjectListener
 * @param transform
 * @param name
 * @param pushTest
 */
export function transformToProjectListener(
    transform: CodeTransform,
    name: string,
    pushTest: PushTest = AnyPush,
): GoalProjectListenerRegistration {
    return {
        name,
        pushTest,
        events: [GoalProjectListenerEvent.before],
        listener: async (p, gi) => {
            try {
                const result = await transform(
                    p,
                    {
                        ...gi,
                    },
                    {},
                );
                if (isTransformResult(result)) {
                    return {
                        code: result.success === true ? 0 : 1,
                    };
                }
            } catch (e) {
                return {
                    code: 1,
                    message: e.message,
                };
            }
            return Success;
        },
    };
}
