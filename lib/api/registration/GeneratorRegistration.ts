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

import {
    Maker,
    NoParameters,
    Project,
    ProjectPersister,
    RemoteRepoRef,
    RepoCreationParameters,
    SeedDrivenGeneratorParameters,
} from "@atomist/automation-client";
import { CommandListenerInvocation } from "../listener/CommandListener";
import { ParametersInvocation } from "../listener/ParametersInvocation";
import { ProjectOperationRegistration } from "./ProjectOperationRegistration";

/**
 * Starting point before transformation. Normally the coordinates of a
 * seed project, but can also be an in memory project or a function that
 * computes a RemoteRepoRef or Project from the parameters.
 */
export type StartingPoint<PARAMS> =
    Project | RemoteRepoRef | ((pi: PARAMS & CommandListenerInvocation<PARAMS>) => (RemoteRepoRef | Project | Promise<Project>));

/**
 * Action that executes after the project has been generated and pushed
 * to the remote repository.
 */
export type ProjectAction<PARAMS> = (p: Project, pi: PARAMS & ParametersInvocation<PARAMS>) => Promise<void>;

/**
 * Register a project creation operation
 */
export interface GeneratorRegistration<PARAMS = NoParameters>
    extends ProjectOperationRegistration<PARAMS, SeedDrivenGeneratorParameters> {

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

    /**
     * Hooks that get executed after a successful project generation.
     * Note: these hooks fire after the project has been generated and
     * pushed to the remote repository.
     */
    afterAction?: ProjectAction<PARAMS> | Array<ProjectAction<PARAMS>>;
}
