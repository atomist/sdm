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

import { CommandRegistration } from "./CommandRegistration";
import { RepoFilter } from "@atomist/automation-client/operations/common/repoFilter";
import { RepoTargets } from "../machine/RepoTargets";
import { Maker } from "@atomist/automation-client/util/constructionUtils";

/**
 * Superclass for all registrations that can apply to one or more projects.
 */
export interface ProjectsOperationRegistration<PARAMS> extends CommandRegistration<PARAMS> {

    /**
     * Allow customization of the repositories that an inspection targets.
     */
    targets?: Maker<RepoTargets>;

    /**
     * Additionally, programmatically target repositories to inspect
     */
    repoFilter?: RepoFilter;

}
