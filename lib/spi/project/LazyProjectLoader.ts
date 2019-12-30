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

import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import {
    ProjectLoader,
    ProjectLoadingParameters,
} from "./ProjectLoader";

export type WithLoadedLazyProject<T = any> = (p: GitProject & LazyProject) => Promise<T>;

/**
 * Marker interface to declare a ProjectLoader to lazily load projects
 */
export interface LazyProjectLoader extends ProjectLoader {

    /**
     * This project loader is always lazy
     */
    isLazy: true;

    /**
     * Perform an action with the given project
     */
    doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedLazyProject<T>): Promise<T>;
}

export interface LazyProject {

    materialized(): boolean;
    materialize(): Promise<GitProject>;
}

export function isLazyProjectLoader(pl: ProjectLoader): pl is LazyProjectLoader {
    return !!pl && !!(pl as LazyProjectLoader).isLazy;
}
