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

import * as build from "../../blueprint/dsl/buildDsl";
import * as deploy from "../../blueprint/dsl/deployDsl";

import { whenPushSatisfies } from "../../blueprint/dsl/goalDsl";
import { SoftwareDeliveryMachine, SoftwareDeliveryMachineOptions } from "../../blueprint/SoftwareDeliveryMachine";
import { MavenBuilder } from "../../common/delivery/build/local/maven/MavenBuilder";
import { interpretMavenLog } from "../../common/delivery/build/local/maven/mavenLogInterpreter";
import { nodeRunBuildBuilder, nodeRunCompileBuilder } from "../../common/delivery/build/local/npm/npmBuilder";
import { NpmDetectBuildMapping } from "../../common/delivery/build/local/npm/NpmDetectBuildMapping";
import { ManagedDeploymentTargeter } from "../../common/delivery/deploy/local/appManagement";
import {
    AutofixGoal,
    LocalDeploymentGoal,
    LocalEndpointGoal,
    NoGoals,
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
} from "../../common/delivery/goals/common/commonGoals";
import { HttpServiceGoals, LocalDeploymentGoals } from "../../common/delivery/goals/common/httpServiceGoals";
import { LibraryGoals } from "../../common/delivery/goals/common/libraryGoals";
import { NpmBuildGoals, NpmDeployGoals } from "../../common/delivery/goals/common/npmGoals";
import { Goals } from "../../common/delivery/goals/Goals";
import { DoNotSetAnyGoals } from "../../common/listener/PushMapping";
import { HasTravisFile } from "../../common/listener/support/pushtest/ci/ciPushTests";
import { FromAtomist, ToDefaultBranch, ToPublicRepo } from "../../common/listener/support/pushtest/commonPushTests";
import { IsDeployEnabled } from "../../common/listener/support/pushtest/deployPushTests";
import { IsMaven } from "../../common/listener/support/pushtest/jvm/jvmPushTests";
import { MaterialChangeToJavaRepo } from "../../common/listener/support/pushtest/jvm/materialChangeToJavaRepo";
import { HasSpringBootApplicationClass } from "../../common/listener/support/pushtest/jvm/springPushTests";
import { NamedSeedRepo } from "../../common/listener/support/pushtest/NamedSeedRepo";
import { MaterialChangeToNodeRepo } from "../../common/listener/support/pushtest/node/materialChangeToNodeRepo";
import { IsNode } from "../../common/listener/support/pushtest/node/nodePushTests";
import { HasCloudFoundryManifest } from "../../common/listener/support/pushtest/pcf/cloudFoundryManifestPushTest";
import { not } from "../../common/listener/support/pushtest/pushTestUtils";
import { createEphemeralProgressLog } from "../../common/log/EphemeralProgressLog";
import { lookFor200OnEndpointRootGet } from "../../common/verify/lookFor200OnEndpointRootGet";
import { disableDeploy, enableDeploy } from "../../handlers/commands/SetDeployEnablement";
import {
    cloudFoundryProductionDeploySpec, cloudFoundryStagingDeploySpec,
    EnableDeployOnCloudFoundryManifestAddition,
} from "../blueprint/deploy/cloudFoundryDeploy";
import {
    LocalExecutableJarDeployer,
    mavenSourceDeployer,
} from "../blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { suggestAddingCloudFoundryManifest } from "../blueprint/repo/suggestAddingCloudFoundryManifest";
import { addCloudFoundryManifest } from "../commands/editors/pcf/addCloudFoundryManifest";
import { addDemoEditors } from "../parts/demo/demoEditors";
import { addJavaSupport, JavaSupportOptions } from "../parts/stacks/javaSupport";
import { addNodeSupport } from "../parts/stacks/nodeSupport";
import { addSpringSupport } from "../parts/stacks/springSupport";
import { addTeamPolicies } from "../parts/team/teamPolicies";

export type CloudFoundryMachineOptions = SoftwareDeliveryMachineOptions & JavaSupportOptions;

/**
 * Assemble a machine that supports Java, Spring and Node and deploys to Cloud Foundry
 * See generatorConfig.ts to customize generation defaults.
 * @return {SoftwareDeliveryMachine}
 */
export function cloudFoundryMachine(options: CloudFoundryMachineOptions): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        "CloudFoundry software delivery machine",
        options,
        whenPushSatisfies(HasTravisFile, IsNode)
            .itMeans("Already builds with Travis")
            .setGoals(new Goals("Autofix only", AutofixGoal)),
        whenPushSatisfies(HasTravisFile)
            .itMeans("Already builds with Travis")
            .setGoals(DoNotSetAnyGoals),
        whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, not(MaterialChangeToJavaRepo))
            .itMeans("No material change to Java")
            .setGoals(NoGoals),
        whenPushSatisfies(ToDefaultBranch, IsMaven, HasSpringBootApplicationClass, HasCloudFoundryManifest,
            ToPublicRepo, not(NamedSeedRepo), not(FromAtomist), IsDeployEnabled)
            .itMeans("Spring Boot service to deploy")
            .setGoals(HttpServiceGoals),
        whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, not(FromAtomist))
            .itMeans("Spring Boot service local deploy")
            .setGoals(LocalDeploymentGoals),
        whenPushSatisfies(IsMaven)
            .itMeans("Build Java")
            .setGoals(LibraryGoals),
        whenPushSatisfies(IsNode, not(MaterialChangeToNodeRepo))
            .itMeans("No material change to Node")
            .setGoals(NoGoals),
        whenPushSatisfies(IsNode, HasCloudFoundryManifest, IsDeployEnabled, ToDefaultBranch)
            .itMeans("Build and deploy node")
            .setGoals(NpmDeployGoals),
        whenPushSatisfies(IsNode)
            .itMeans("Build with npm")
            .setGoals(NpmBuildGoals),
    );

    const runBuildBuilder = nodeRunBuildBuilder(options.projectLoader);
    const runCompileBuilder = nodeRunCompileBuilder(options.projectLoader);

    sdm.addBuildRules(
        new NpmDetectBuildMapping(options.artifactStore, options.projectLoader),
        build.when(IsNode, ToDefaultBranch)
            .itMeans("Try standard node build")
            .set(runBuildBuilder),
        build.when(IsNode)
            .itMeans("Just compile")
            .set(runCompileBuilder),
        build.setDefault(new MavenBuilder(options.artifactStore,
            createEphemeralProgressLog, options.projectLoader)),
    )
        .addDeployRules(
            deploy.when(IsMaven)
                .itMeans("Maven test")
                .deployTo(StagingDeploymentGoal, StagingEndpointGoal)
                .using(
                    {
                        deployer: LocalExecutableJarDeployer,
                        targeter: ManagedDeploymentTargeter,
                    },
                ),
            deploy.when(IsMaven)
                .itMeans("Maven production")
                .deployTo(ProductionDeploymentGoal, ProductionEndpointGoal)
                .using(cloudFoundryProductionDeploySpec(options)),
            deploy.when(IsNode)
                .itMeans("Node test")
                .deployTo(StagingDeploymentGoal, StagingEndpointGoal)
                .using(cloudFoundryStagingDeploySpec(options)),
        )
        .addNewRepoWithCodeActions(suggestAddingCloudFoundryManifest)
        .addSupportingCommands(
            () => addCloudFoundryManifest,
            () => enableDeploy(),
            () => disableDeploy(),
        )
        .addCodeReactions(EnableDeployOnCloudFoundryManifestAddition)
        .addEndpointVerificationListeners(lookFor200OnEndpointRootGet());

    addJavaSupport(sdm, options);
    addSpringSupport(sdm, options);
    addNodeSupport(sdm);
    addTeamPolicies(sdm);
    addDemoEditors(sdm);
    return sdm;
}
