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

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectPersister } from "@atomist/automation-client/operations/generate/generatorUtils";
import { RepoCreationParameters } from "@atomist/automation-client/operations/generate/RepoCreationParameters";
import { Project } from "@atomist/automation-client/project/Project";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { ProjectOperationRegistration } from "./ProjectOperationRegistration";

/**
 * Starting point before transformation. Normally the coordinates of a
 * seed project, but can also be an in memory project or a function that
 * computes a RemoteRepoRef or Project from the parameters.
 */
export type StartingPoint<PARAMS> = Project | RemoteRepoRef | ((parameters: PARAMS) => (RemoteRepoRef | Project));

/**
 * Register a project creation operation
 */
export interface GeneratorRegistration<PARAMS = NoParameters>
    extends ProjectOperationRegistration<PARAMS> {

    /**
     * Starting point before transformation. Normally the coordinates of a
     * seed project, but can also be in memory.
     * The alternative is to get this from a config object.
     */
    startingPoint?: StartingPoint<PARAMS>;

    /**
     * Strategy for persisting projects. Useful in testing.
     */
    projectPersister?: ProjectPersister;

    /**
     * Allow customization of the target for this repo,
     * e.g. to target a different source control system.
     */
    fallbackTarget?: Maker<RepoCreationParameters>;
}
