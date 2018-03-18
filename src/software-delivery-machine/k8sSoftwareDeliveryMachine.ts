/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    onAnyPush,
    whenPushSatisfies,
} from "../blueprint/ruleDsl";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { K8sAutomationBuilder } from "../common/delivery/build/k8s/K8AutomationBuilder";
import {
    HttpServiceGoals,
    LocalDeploymentGoals,
} from "../common/delivery/goals/common/httpServiceGoals";
import { LibraryGoals } from "../common/delivery/goals/common/libraryGoals";
import { NpmBuildGoals } from "../common/delivery/goals/common/npmGoals";
import {
    HasSpringBootApplicationClass,
    IsMaven,
} from "../common/listener/support/jvmPushTests";
import { HasK8Spec } from "../common/listener/support/k8sSpecPushTest";
import { MaterialChangeToJavaRepo } from "../common/listener/support/materialChangeToJavaRepo";
import { IsNode } from "../common/listener/support/nodeGuards";
import {
    FromAtomist,
    ToDefaultBranch,
    ToPublicRepo,
} from "../common/listener/support/pushTests";
import { not } from "../common/listener/support/pushTestUtils";
import { lookFor200OnEndpointRootGet } from "../common/verify/lookFor200OnEndpointRootGet";
import { DefaultArtifactStore } from "./blueprint/artifactStore";
import {
    K8sProductionDeployOnSuccessStatus,
    K8sStagingDeployOnSuccessStatus,
    NoticeK8sProdDeployCompletion,
    NoticeK8sTestDeployCompletion,
} from "./blueprint/deploy/k8sDeploy";
import { suggestAddingK8sSpec } from "./blueprint/repo/suggestAddingK8sSpec";
import { addK8sSpec } from "./commands/editors/k8s/addK8sSpec";
import { addNodeSupport } from "./nodeSupport";
import { addSpringSupport } from "./springSupport";
import { addTeamPolicies } from "./teamPolicies";

export function k8sSoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        {
            deployers: [
                K8sStagingDeployOnSuccessStatus,
                K8sProductionDeployOnSuccessStatus,
            ],
            artifactStore: DefaultArtifactStore,
        },

        whenPushSatisfies(ToDefaultBranch, IsMaven, HasSpringBootApplicationClass,
            HasK8Spec,
            ToPublicRepo)
            .itMeans("Spring Boot service to deploy")
            .setGoals(HttpServiceGoals),
        whenPushSatisfies(not(FromAtomist), IsMaven, HasSpringBootApplicationClass)
            .itMeans("Spring Boot service local deploy")
            .setGoals(LocalDeploymentGoals),
        whenPushSatisfies(IsMaven, MaterialChangeToJavaRepo)
            .itMeans("Build Java")
            .setGoals(LibraryGoals),
        onAnyPush.buildWith(new K8sAutomationBuilder()),
    );
    sdm.addNewRepoWithCodeActions(suggestAddingK8sSpec)
        .addSupportingCommands(() => addK8sSpec)
        .addSupportingEvents(() => NoticeK8sTestDeployCompletion,
            () => NoticeK8sProdDeployCompletion)
        .addEndpointVerificationListeners(
            lookFor200OnEndpointRootGet({
                retries: 15,
                maxTimeout: 5000,
                minTimeout: 3000,
            }),
        );
    addSpringSupport(sdm, opts);
    addNodeSupport(sdm);
    addTeamPolicies(sdm);
    return sdm;
}
