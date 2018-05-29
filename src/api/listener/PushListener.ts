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

import { OnPushToAnyBranch } from "../../typings/types";
import { SdmListener } from "./Listener";
import { ProjectListenerInvocation } from "./ProjectListener";

/**
 * Invocation for an event relating to a push on a project.
 * Many event listeners listen to this type of event.
 */
export interface PushListenerInvocation extends ProjectListenerInvocation {

    /**
     * Information about the push, including repo and commit
     */
    readonly push: OnPushToAnyBranch.Push;

}

export type PushListener = SdmListener<PushListenerInvocation>;
