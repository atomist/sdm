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

import {
    DependencySpecifier,
    VersionedArtifact,
} from "./VersionedArtifact";

/**
 * Plugin definition for a Maven POM
 */
export interface Plugin extends DependencySpecifier {
    group: string;

    artifact: string;

    version?: string;

    configuration?: any;

    extensions?: boolean;

    inherited?: boolean;

    dependencies?: VersionedArtifact[];

    executions?: PluginExecution[];
}

/**
 * Managed plugin definition for a Maven POM
 */
export interface ManagedPlugin extends DependencySpecifier {
    group: string;

    artifact: string;

    version: string;

    configuration?: any;

    extensions?: boolean;

    inherited?: boolean;

    dependencies?: VersionedArtifact[];

    executions?: PluginExecution[];
}

/**
 * Plugin execution definition for a Maven POM
 */
export interface PluginExecution {
    id: string;

    goals: PluginExecutionGoal[];

    phase: string;

    inherited: boolean;

    configuration: any;
}

/**
 * Plugin execution goal definition for a Maven POM
 */
export interface PluginExecutionGoal {
    name: string;
}
