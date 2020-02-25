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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import * as _ from "lodash";
import { ExecuteGoalResult } from "../../../../api/goal/ExecuteGoalResult";
import {
    Goal,
    GoalDefinition,
} from "../../../../api/goal/Goal";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../../../api/goal/GoalInvocation";
import { DefaultGoalNameGenerator } from "../../../../api/goal/GoalNameGenerator";
import {
    FulfillableGoalDetails,
    FulfillableGoalWithRegistrations,
    getGoalDefinitionFrom,
} from "../../../../api/goal/GoalWithFulfillment";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { SoftwareDeliveryMachine } from "../../../../api/machine/SoftwareDeliveryMachine";
import { PushTest } from "../../../../api/mapping/PushTest";
import { AnyPush } from "../../../../api/mapping/support/commonPushTests";
import { SdmGoalState } from "../../../../typings/types";
import { isInLocalMode } from "../../../machine/modes";
import { KubernetesApplication } from "../kubernetes/request";
import { getClusterLabel } from "./cluster";
import { generateKubernetesGoalEventData } from "./data";
import { deployApplication } from "./deploy";

/** Return repository slug for SDM goal event. */
export function goalEventSlug(goalEvent: SdmGoalEvent): string {
    return `${goalEvent.repo.owner}/${goalEvent.repo.name}`;
}

/**
 * Function signature for callback that can modify and return the
 * [[KubernetesApplication]] object.
 */
export type KubernetesApplicationDataCallback =
    (a: KubernetesApplication, p: GitProject, g: KubernetesDeploy, e: SdmGoalEvent, ctx: HandlerContext) => Promise<KubernetesApplication>;

/**
 * Sources of information for Kubernetes goal application data.
 */
export enum KubernetesDeployDataSources {
    /** Read deployment spec from `.atomist/kubernetes`. */
    DeploymentSpec = "DeploymentSpec",
    /** Read EXPOSE from Dockerfile to get service port. */
    Dockerfile = "Dockerfile",
    /** Parse `goalEvent.data` as JSON. */
    GoalEvent = "GoalEvent",
    /** Read ingress spec from `.atomist/kubernetes`. */
    IngressSpec = "IngressSpec",
    /** Read role-binding spec from `.atomist/kubernetes`. */
    RoleBindingSpec = "RoleBindingSpec",
    /** Read role spec from `.atomist/kubernetes`. */
    RoleSpec = "RoleSpec",
    /** Load `sdm.configuration.sdm.k8s.app`. */
    SdmConfiguration = "SdmConfiguration",
    /** Read service-account spec from `.atomist/kubernetes`. */
    ServiceAccountSpec = "ServiceAccountSpec",
    /** Read service spec from `.atomist/kubernetes`. */
    ServiceSpec = "ServiceSpec",
}

/**
 * Registration object to pass to KubernetesDeployment goal to
 * configure how deployment works.
 */
export interface KubernetesDeployRegistration {
    /**
     * Allows the user of this pack to modify the default application
     * data before execution of deployment.
     */
    applicationData?: KubernetesApplicationDataCallback;
    /**
     * If falsey, this SDM will fulfill its own Kubernetes deployment
     * goals.  If set, its value defines the name of the SDM that will
     * fulfill the goal.  In this case, there should be another SDM
     * running whose name, i.e., its name as defined in its
     * registration/package.json, is the same as this name.
     */
    name?: string;
    /**
     * Optional push test for this goal implementation.
     */
    pushTest?: PushTest;
    /**
     * Determine what parts of the repository to use to generate the
     * initial Kubernetes goal application data.  It no value is
     * provided, all sources are used.
     */
    dataSources?: KubernetesDeployDataSources[];
}

/**
 * Goal that initiates deploying an application to a Kubernetes
 * cluster.  Deploying the application is completed by the
 * [[kubernetesDeployHandler]] event handler.  By default, this goal
 * will be configured such that it is fulfilled by the SDM that
 * creates it.  To have this goal be executed by another SDM, set the
 * fulfillment name to the name of that SDM:
 *
 *     const deploy = new KubernetesDeploy()
 *         .with({ name: otherSdm.configuration.name });
 *
 */
export class KubernetesDeploy extends FulfillableGoalWithRegistrations<KubernetesDeployRegistration> {

    /**
     * Create a KubernetesDeploy object.
     *
     * @param details Define unique aspects of this Kubernetes deployment, see [[KubernetesDeploy.details]].
     * @param dependsOn Other goals that must complete successfully before scheduling this goal.
     */
    constructor(public readonly details: FulfillableGoalDetails = {}, ...dependsOn: Goal[]) {
        super(getGoalDefinitionFrom(details, DefaultGoalNameGenerator.generateName("kubernetes-deploy")), ...dependsOn);
    }

    /**
     * Register a deployment with the initiator fulfillment.
     */
    public with(registration: KubernetesDeployRegistration): this {
        const fulfillment = registration.name || this.sdm.configuration.name;
        this.addFulfillment({
            name: fulfillment,
            goalExecutor: initiateKubernetesDeploy(this, registration),
            pushTest: registration.pushTest,
        });
        this.updateGoalName(fulfillment);

        return this;
    }

    /**
     * Called by the SDM on initialization.  This function calls
     * `super.register` and adds a startup listener to the SDM.
     *
     * The startup listener registers a default goal fulfillment that
     * adds itself as fulfiller of its deployment requests if this
     * goal has no fulfillments or callbacks at startup.
     */
    public register(sdm: SoftwareDeliveryMachine): void {
        super.register(sdm);

        sdm.addStartupListener(async () => {
            if (this.fulfillments.length === 0 && this.callbacks.length === 0) {
                this.with({ pushTest: AnyPush });
            }
        });
    }

    /**
     * Set the goal "name" and goal definition "displayName".  If any
     * goal definition description is not set, populate it with a
     * reasonable default.
     *
     * @param fulfillment Name of fulfillment, typically the cluster-scoped name of k8s-sdm
     * @return object
     */
    private updateGoalName(fulfillment: string): this {
        const env = (this.details && this.details.environment) ? this.details.environment : this.environment;
        const clusterLabel = getClusterLabel(env, fulfillment);
        const displayName = this.definition.displayName || "deploy";
        const goalName = `${displayName}${clusterLabel}`;
        this.definition.displayName = goalName;
        const defaultDefinitions: Partial<GoalDefinition> = {
            canceledDescription: `Canceled: ${goalName}`,
            completedDescription: `Deployed${clusterLabel}`,
            failedDescription: `Deployment${clusterLabel} failed`,
            plannedDescription: `Planned: ${goalName}`,
            requestedDescription: `Requested: ${goalName}`,
            skippedDescription: `Skipped: ${goalName}`,
            stoppedDescription: `Stopped: ${goalName}`,
            waitingForApprovalDescription: `Successfully deployed${clusterLabel}`,
            waitingForPreApprovalDescription: `Deploy${clusterLabel} pending approval`,
            workingDescription: `Deploying${clusterLabel}`,
        };
        _.defaultsDeep(this.definition, defaultDefinitions);
        return this;
    }

}

/**
 * Populate data sources properrty of registration with all possible
 * KubernetesGoalDataSources if it is not defined.  Otherwise, leave
 * it as is.  The registration object is modified directly and
 * returned.
 *
 * @param registration Kubernetes deploy object registration
 * @return registration with data sources
 */
export function defaultDataSources(registration: KubernetesDeployRegistration): KubernetesDeployRegistration {
    if (!registration.dataSources) {
        registration.dataSources = Object.values(KubernetesDeployDataSources);
    }
    return registration;
}

/**
 * If in SDM team mode, this goal executor generates and stores the
 * Kubernetes application data for deploying an application to
 * Kubernetes.  It returns the augmented SdmGoalEvent with the
 * Kubernetes application information in the `data` property and the
 * state of the SdmGoalEvent set to "requested".  The actual
 * deployment is done by the [[kubernetesDeployHandler]] event
 * handler.
 *
 * It will call [[defaultDataSources]] to populate the default
 * repository data sources if none are provided in the registration.
 *
 * If in SDM local mode, generate the Kubernetes application data and
 * deploy the application.
 *
 * @param k8Deploy Kubernetes deploy object
 * @param registration Kubernetes deploy object registration
 * @return An ExecuteGoal result that is not really a result, but an intermediate state.
 */
export function initiateKubernetesDeploy(k8Deploy: KubernetesDeploy, registration: KubernetesDeployRegistration): ExecuteGoal {
    return async (goalInvocation: GoalInvocation): Promise<ExecuteGoalResult> => {
        defaultDataSources(registration);
        const goalEvent = await generateKubernetesGoalEventData(k8Deploy, registration, goalInvocation);
        if (isInLocalMode()) {
            return deployApplication(goalEvent, goalInvocation.context, goalInvocation.progressLog);
        } else {
            goalEvent.state = SdmGoalState.requested;
            return goalEvent;
        }
    };
}
