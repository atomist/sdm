/*
 * Copyright © 2020 Atomist, Inc.
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
import { testProgressReporter } from "../../../api-helper/goal/progress/progress";
import { RepoContext } from "../../../api/context/SdmContext";
import { Goal } from "../../../api/goal/Goal";
import { DefaultGoalNameGenerator } from "../../../api/goal/GoalNameGenerator";
import {
    FulfillableGoal,
    FulfillableGoalDetails,
    FulfillableGoalWithRegistrations,
    Fulfillment,
    getGoalDefinitionFrom,
    ImplementationRegistration,
} from "../../../api/goal/GoalWithFulfillment";
import { SdmGoalEvent } from "../../../api/goal/SdmGoalEvent";
import { GoalFulfillmentCallback } from "../../../api/goal/support/GoalImplementationMapper";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import {
    KubernetesFulfillmentGoalScheduler,
    KubernetesFulfillmentOptions,
} from "../../pack/k8s/scheduler/KubernetesFulfillmentGoalScheduler";
import { toArray } from "../../util/misc/array";
import {
    CacheEntry,
    cachePut,
    cacheRestore,
} from "../cache/goalCaching";
import { dockerContainerScheduler } from "./docker";
import {
    runningAsGoogleCloudFunction,
    runningInK8s,
} from "./util";

export const ContainerRegistrationGoalDataKey = "@atomist/sdm/container";

/**
 * Create and return a container goal with the provided container
 * specification.
 *
 * @param displayName Goal display name
 * @param registration Goal containers, volumes, cache details, etc.
 * @return SDM container goal
 */
export function container<T extends ContainerRegistration>(displayName: string, registration: T): FulfillableGoal {
    return new Container({ displayName }).with(registration);
}

export const ContainerProgressReporter = testProgressReporter({
    test: /docker 'network' 'create'/i,
    phase: "starting up",
}, {
    test: /docker 'network' 'rm'/i,
    phase: "shutting down",
}, {
    test: /docker 'run' .* '--workdir=[a-zA-Z\/]*' .* '--network-alias=([a-zA-Z \-_]*)'/i,
    phase: "running $1",
}, {
    test: /atm:phase=(.*)/i,
    phase: "$1",
});

/**
 * Ports to expose from container.
 */
export interface ContainerPort {
    /**
     * Number of port to expose from the container. This must be
     * a valid port number, 0 < x < 65536.
     */
    containerPort: number;
}

/**
 * Volumes to mount in container.
 */
export interface ContainerVolumeMount {
    /** Path to mount point of volume. */
    mountPath: string;
    /** Name of volume from [[GoalContainer.volumes]]. */
    name: string;
}

export interface ContainerSecrets {
    env?: Array<{ name: string } & GoalContainerSecret>;
    fileMounts?: Array<{ mountPath: string } & GoalContainerSecret>;
}

/**
 * Simplified container abstraction for goals.
 */
export interface GoalContainer {
    /** Unique name for this container within this goal. */
    name: string;
    /** Full Docker image name, i.e., `registry/name:tag`. */
    image: string;
    /**
     * Docker command and arguments.  We call this `args` rather than
     * `command` because we think k8s got it right.
     */
    args?: string[];
    /**
     * Docker image entrypoint.  We call this `command` rather than
     * `entrypoint` because we think k8s got it right.
     */
    command?: string[];
    /**
     * Environment variables to set in Docker container.
     */
    env?: Array<{ name: string, value: string }>;
    /**
     * Ports to expose from container.
     */
    ports?: ContainerPort[];
    /**
     * Volumes to mount in container.
     */
    volumeMounts?: ContainerVolumeMount[];
    /**
     * Provider secrets that should be made available to the container
     */
    secrets?: ContainerSecrets;
}

export interface GoalContainerProviderSecret {
    provider: {
        type: "docker" | "npm" | "maven2" | "scm" | "atomist" | string;
        names?: string[];
    };
}

export interface GoalContainerEncryptedSecret {
    encrypted: string;
}

export interface GoalContainerSecret {
    value: GoalContainerProviderSecret | GoalContainerEncryptedSecret;
}

/**
 * Volumes that containers in goal can mount.
 */
export interface GoalContainerVolume {
    /** Volume to be created from local host file system location. */
    hostPath: {
        /** Absolute path on host to volume. */
        path: string;
    };
    /** Unique name of volume, referenced by [[ContainerVolumeMount.name]]. */
    name: string;
}

/**
 * File system location of goal project in containers.
 */
export const ContainerProjectHome = "/atm/home";

/**
 * File system location for goal container input.
 */
export const ContainerInput = "/atm/input";

/**
 * File system location for goal container output.
 */
export const ContainerOutput = "/atm/output";

/**
 * Goal execution result file
 */
export const ContainerResult = `${ContainerOutput}/result.json`;

/**
 * Specification of containers and volumes for a container goal.
 */
export interface GoalContainerSpec {
    /**
     * Containers to run for this goal.  The goal result is based on
     * the exit status of the first element of the `containers` array.
     * The other containers are considered "sidecar" containers
     * provided functionality that the main container needs to
     * function.  The working directory of the first container is set
     * to [[ContainerProjectHome]], which contains the project upon
     * which the goal should operate.
     */
    containers: GoalContainer[];
    /**
     * Volumes available to mount in containers.
     */
    volumes?: GoalContainerVolume[];
}

/**
 * Function signature for callback that can modify and return the
 * [[ContainerRegistration]] object.
 */
export type ContainerSpecCallback =
    (r: ContainerRegistration, p: GitProject, g: Container, e: SdmGoalEvent, c: RepoContext) => Promise<GoalContainerSpec>;

/**
 * Container goal artifacts and implementations information.
 */
export interface ContainerRegistration extends Partial<ImplementationRegistration>, GoalContainerSpec {
    /**
     * Callback function to dynamically modify the goal container spec
     * when goal is executed.
     */
    callback?: ContainerSpecCallback;
    /**
     * Cache classifiers to retrieve from cache before starting goal
     * execution.  The values must correspond to output classifiers
     * from previously executed container goals in the same goal set.
     */
    input?: Array<{ classifier: string }>;
    /**
     * File path globs to store in cache after goal execution.
     * They values should be glob paths relative to the root of
     * the project directory.
     */
    output?: CacheEntry[];
}

/**
 * Container goal scheduler implementation.  The goal execution is
 * handled as part of the execution of the container.
 */
export type ContainerScheduler = (goal: Container, registration: ContainerRegistration) => void;

export interface ContainerGoalDetails extends FulfillableGoalDetails {
    /**
     * Container goal scheduler.  If no scheduler is provided, the k8s
     * scheduler is used if the SDM is running in a Kubernetes
     * cluster, otherwise the Docker scheduler is used.
     */
    scheduler?: ContainerScheduler;
}

/**
 * Goal run as a container, as seen on TV.
 */
export class Container extends FulfillableGoalWithRegistrations<ContainerRegistration> {

    public readonly details: ContainerGoalDetails;

    constructor(details: ContainerGoalDetails = {}, ...dependsOn: Goal[]) {
        const prefix = "container" + (details.displayName ? `-${details.displayName}` : "");
        const detailsToUse = { ...details, isolate: true };
        super(getGoalDefinitionFrom(detailsToUse, DefaultGoalNameGenerator.generateName(prefix)), ...dependsOn);
        this.details = detailsToUse;
    }

    public register(sdm: SoftwareDeliveryMachine): void {
        super.register(sdm);

        const goalSchedulers = toArray(sdm.configuration.sdm.goalScheduler) || [];
        if (runningInK8s()) {
            // load lazily to prevent early and unwanted initialization of expensive K8s api
            const kgs = require("../../pack/k8s/scheduler/KubernetesGoalScheduler");
            // Make sure that the KubernetesGoalScheduler gets added if needed
            if (!goalSchedulers.some(gs => gs instanceof kgs.KubernetesGoalScheduler)) {
                if (!process.env.ATOMIST_ISOLATED_GOAL && kgs.isConfiguredInEnv("kubernetes", "kubernetes-all")) {
                    sdm.configuration.sdm.goalScheduler = [...goalSchedulers, new kgs.KubernetesGoalScheduler()];
                }
            }
        } else if (runningAsGoogleCloudFunction()) {
            const options: KubernetesFulfillmentOptions = sdm.configuration.sdm?.k8s?.fulfillment;
            if (!goalSchedulers.some(gs => gs instanceof KubernetesFulfillmentGoalScheduler)) {
                sdm.configuration.sdm.goalScheduler = [
                    ...goalSchedulers,
                    new KubernetesFulfillmentGoalScheduler(options),
                ];
            }
        }
    }

    public with(registration: ContainerRegistration): this {
        super.with(registration);

        registration.name = (registration.name || `container-${this.definition.displayName}`).replace(/\.+/g, "-");
        if (!this.details.scheduler) {
            if (runningInK8s()) {
                const k8sContainerScheduler = require("../../pack/k8s/container").k8sContainerScheduler;
                this.details.scheduler = k8sContainerScheduler;
            } else if (runningAsGoogleCloudFunction()) {
                const k8sSkillContainerScheduler = require("../../pack/k8s/container").k8sSkillContainerScheduler;
                this.details.scheduler = k8sSkillContainerScheduler;
            } else {
                this.details.scheduler = dockerContainerScheduler;
            }
        }
        this.details.scheduler(this, registration);
        if (registration.input && registration.input.length > 0) {
            this.withProjectListener(cacheRestore({ entries: registration.input }));
        }
        if (registration.output && registration.output.length > 0) {
            this.withProjectListener(cachePut({ entries: registration.output }));
        }
        return this;
    }

    public addFulfillment(fulfillment: Fulfillment): this {
        return super.addFulfillment(fulfillment);
    }

    public addFulfillmentCallback(cb: GoalFulfillmentCallback): this {
        return super.addFulfillmentCallback(cb);
    }
}
