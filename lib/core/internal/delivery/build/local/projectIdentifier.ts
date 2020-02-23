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

import { Project } from "@atomist/automation-client/lib/project/Project";

export interface ProjectIdentification {
    name: string;
    version: string;
}

/**
 * Return identification of this project or undefined if it can't be identified
 * @ModuleExport
 */
export type ProjectIdentifier = (p: Project) => Promise<ProjectIdentification | undefined>;
