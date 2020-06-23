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

import { Goal, GoalDefinition } from "../../../../api/goal/Goal";
import { DefaultGoalNameGenerator } from "../../../../api/goal/GoalNameGenerator";
import {
    FulfillableGoalDetails,
    FulfillableGoalWithRegistrations,
    getGoalDefinitionFrom,
    ImplementationRegistration,
    mergeOptions,
} from "../../../../api/goal/GoalWithFulfillment";
import { IndependentOfEnvironment } from "../../../../api/goal/support/environment";
import { GitProject } from "../../../../client";
import { DockerProgressReporter } from "./DockerProgressReporter";
import { DefaultDockerImageNameCreator, DockerImageNameCreator, executeDockerBuild } from "./executeDockerBuild";

export interface DockerRegistry {
    /**
     * Push Url for this registry
     */
    registry: string;

    /**
     * Should this registry be displayed with the goal status after a push? Default true.
     */
    display?: boolean;

    /**
     * Display Url - ie the url humans can go to
     * assumes <url>/<image>
     */
    displayUrl?: string;

    /**
     * If specified, this will replace the label version details (eg <image><:version>)
     * For example, for Dockerhub the correct value would be `/tags`, with a displayUrl set
     * to https://hub.docker.com/r/<user/org>; will result in:
     * https://hub.docker.com/r/<user/org>/<image>/tags as the link URL
     *
     */
    displayBrowsePath?: string;

    /**
     * How should urls to this registry be labeled?
     * ie DockerHub, ECR, etc (friendly name instead of big tag string)
     * if not supplied, we'll display the tag
     */
    label?: string;

    user?: string;
    password?: string;
}

/**
 * Options to configure the Docker image build
 */
export interface DockerOptions extends Partial<ImplementationRegistration> {
    /**
     * Provide the image tag for the docker image to build
     */
    dockerImageNameCreator?: DockerImageNameCreator;

    /**
     * True if the docker image should be pushed to the registry
     */
    push?: boolean;

    /**
     * True if pushes should happen concurrently
     */
    concurrentPush?: boolean;

    /**
     * Optional registries to push the docker image too.
     * Needs to set when push === true
     */
    registry?: DockerRegistry | DockerRegistry[];

    /**
     * Optional Docker config in json as alternative to running
     * 'docker login' with provided registry, user and password.
     */
    config?: string;

    /**
     * Find the Dockerfile within the project
     * @param p the project
     */
    dockerfileFinder?: (p: GitProject) => Promise<string>;

    /**
     * Optionally specify what docker image builder to use.
     * Defaults to "docker"
     */
    builder?: "docker" | "kaniko";

    /**
     * Optional arguments passed to the docker image builder
     */
    builderArgs?: string[];

    /**
     * Path relative to base of project to build.  If not provided,
     * ".", i.e., the project base directory, is used.
     */
    builderPath?: string;
}

const DefaultDockerOptions: DockerOptions = {
    dockerImageNameCreator: DefaultDockerImageNameCreator,
    dockerfileFinder: async () => "Dockerfile",
    builder: "docker",
    builderArgs: [],
    builderPath: ".",
};

/**
 * Goal that performs docker build and push depending on the provided options
 */
export class DockerBuild extends FulfillableGoalWithRegistrations<DockerOptions> {
    constructor(
        goalDetailsOrUniqueName: FulfillableGoalDetails | string = DefaultGoalNameGenerator.generateName(
            "docker-build",
        ),
        ...dependsOn: Goal[]
    ) {
        super(
            getGoalDefinitionFrom(
                goalDetailsOrUniqueName,
                DefaultGoalNameGenerator.generateName("docker-build"),
                DockerBuildDefinition,
            ),
            ...dependsOn,
        );
    }

    public with(registration: DockerOptions): this {
        const optsToUse = mergeOptions<DockerOptions>(DefaultDockerOptions, registration);

        this.addFulfillment({
            goalExecutor: executeDockerBuild(optsToUse),
            name: DefaultGoalNameGenerator.generateName("docker-builder"),
            progressReporter: DockerProgressReporter,
            ...(registration as ImplementationRegistration),
        });
        return this;
    }
}

const DockerBuildDefinition: GoalDefinition = {
    uniqueName: "docker-build",
    displayName: "docker build",
    environment: IndependentOfEnvironment,
    workingDescription: "Running docker build",
    completedDescription: "Docker build successful",
    failedDescription: "Docker build failed",
    isolated: true,
    retryFeasible: true,
};
