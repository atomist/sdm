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

import * as schema from "../../typings/types";
import { RepoListenerInvocation, SdmListener } from "./Listener";

/**
 * Superinterface for all event invocations concerning a repo.
 */
export interface RepoCreationListenerInvocation extends RepoListenerInvocation {

    repo: schema.OnRepoCreation.Repo;
}

/**
 * Respond to the creation of a new repo.
 * Note that it may not have code in it, so you may want to use
 * a PushListener! See SoftwareDeliveryMachine.addNewRepoWithCodeActions
 */
export type RepoCreationListener = SdmListener<RepoCreationListenerInvocation>;
