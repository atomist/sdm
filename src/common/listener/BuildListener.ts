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

import { OnBuildComplete } from "../../typings/types";
import { RepoListenerInvocation, SdmListener } from "./Listener";
import Build = OnBuildComplete.Build;

/**
 * Invocation for a build on a project. Not a part of delivery control:
 * Purely for observational purposes, such as determining the time
 * a build took.
 */
export interface BuildListenerInvocation extends RepoListenerInvocation {

    /**
     * Build that has just completed.
     */
   build: Build;

}

export type BuildListener = SdmListener<BuildListenerInvocation>;
