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
} from "../../blueprint/ruleDsl";
import { SoftwareDeliveryMachine } from "../../blueprint/SoftwareDeliveryMachine";
import { K8sAutomationBuilder } from "../../common/delivery/build/k8s/K8AutomationBuilder";
import {
    HttpServiceGoals,
    LocalDeploymentGoals,
} from "../../common/delivery/goals/common/httpServiceGoals";
import { LibraryGoals } from "../../common/delivery/goals/common/libraryGoals";
import {
    FromAtomist,
    ToDefaultBranch,
    ToPublicRepo,
} from "../../common/listener/support/pushtest/commonPushTests";
import { IsDeployEnabled } from "../../common/listener/support/pushtest/deployPushTests";
import {
    HasSpringBootApplicationClass,
    IsMaven,
} from "../../common/listener/support/pushtest/jvm/jvmPushTests";
import { MaterialChangeToJavaRepo } from "../../common/listener/support/pushtest/jvm/materialChangeToJavaRepo";
import { HasK8Spec } from "../../common/listener/support/pushtest/k8s/k8sSpecPushTest";
import { not } from "../../common/listener/support/pushtest/pushTestUtils";
import { lookFor200OnEndpointRootGet } from "../../common/verify/lookFor200OnEndpointRootGet";
import { disableDeploy, enableDeploy } from "../../handlers/commands/SetDeployEnablement";
import { DefaultArtifactStore } from "../blueprint/artifactStore";
import {
    K8sProductionDeployOnSuccessStatus,
    K8sStagingDeployOnSuccessStatus,
    NoticeK8sProdDeployCompletion,
    NoticeK8sTestDeployCompletion,
} from "../blueprint/deploy/k8sDeploy";
import { suggestAddingK8sSpec } from "../blueprint/repo/suggestAddingK8sSpec";
import { addK8sSpec } from "../commands/editors/k8s/addK8sSpec";
import { addDemoEditors } from "../parts/demo/demoEditors";
import { addJavaSupport } from "../parts/stacks/javaSupport";
import { addNodeSupport } from "../parts/stacks/nodeSupport";
import { addSpringSupport } from "../parts/stacks/springSupport";
import { addTeamPolicies } from "../parts/team/teamPolicies";

export function k8sSoftwareDeliveryMachine(opts: { useCheckstyle: boolean }): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        {
            deployers: [
                K8sStagingDeployOnSuccessStatus,
                K8sProductionDeployOnSuccessStatus,
            ],
            artifactStore: DefaultArtifactStore,
        },

        whenPushSatisfies(
            ToDefaultBranch,
            IsMaven,
            HasSpringBootApplicationClass,
            HasK8Spec,
            ToPublicRepo,
            IsDeployEnabled)
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
        .addSupportingCommands(
            () => addK8sSpec,
            () => enableDeploy(),
            () => disableDeploy(),
        )
        .addSupportingEvents(() => NoticeK8sTestDeployCompletion,
            () => NoticeK8sProdDeployCompletion)
        .addEndpointVerificationListeners(
            lookFor200OnEndpointRootGet({
                retries: 15,
                maxTimeout: 5000,
                minTimeout: 3000,
            }),
        );

    addJavaSupport(sdm, opts);
    addSpringSupport(sdm, opts);
    addNodeSupport(sdm);
    addTeamPolicies(sdm);

    addDemoEditors(sdm);
    return sdm;
}
