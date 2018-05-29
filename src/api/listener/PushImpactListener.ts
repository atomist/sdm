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

import { Project } from "@atomist/automation-client/project/Project";
import { StatusForExecuteGoal } from "../../typings/types";
import { SdmListener } from "./Listener";
import { PushListenerInvocation } from "./PushListener";

/**
 * Invocation object used by most listeners that react to code changes.
 * Provides fuller information about the impact of the push.
 */
export interface PushImpactListenerInvocation extends PushListenerInvocation {

    /**
     * Files changed in this push. Undefined if unknown how many files have changed
     */
    filesChanged: string[] | undefined;

    /**
     * Head commit on push
     */
    commit: StatusForExecuteGoal.Commit;

    /**
     * Project of affected files. May be the same as project, if we can't tell
     * which files were affected.
     */
    impactedSubProject: Project;
}

export type PushImpactListener = SdmListener<PushImpactListenerInvocation>;
