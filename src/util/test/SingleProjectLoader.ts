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

import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Project } from "@atomist/automation-client/project/Project";
import { ProjectLoader, ProjectLoadingParameters, WithLoadedProject } from "../../spi/project/ProjectLoader";

/**
 * ProjectLoader that can only return one project.
 * Normally used in testing.
 */
export class SingleProjectLoader implements ProjectLoader {

    constructor(private readonly project: Project) {}

    public doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        return action(this.project as GitProject);
    }
}
