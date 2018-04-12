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
import {
    SoftwareDeliveryMachine,
    SoftwareDeliveryMachineOptions,
} from "../../blueprint/SoftwareDeliveryMachine";
import { leinBuilder } from "../../common/delivery/build/local/lein/leinBuilder";
import { MavenBuilder } from "../../common/delivery/build/local/maven/MavenBuilder";
import {
    nodeRunBuildBuilder,
    nodeRunCompileBuilder,
} from "../../common/delivery/build/local/npm/npmBuilder";
import { npmCustomBuilder } from "../../common/delivery/build/local/npm/NpmDetectBuildMapping";
import { ManagedDeploymentTargeter } from "../../common/delivery/deploy/local/appManagement";
import {
    AutofixGoal,
    NoGoals,
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    ProductionUndeploymentGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingUndeploymentGoal,
} from "../../common/delivery/goals/common/commonGoals";
import {
    HttpServiceGoals,
    LocalDeploymentGoals,
    RepositoryDeletionGoals,
    UndeployEverywhereGoals,
} from "../../common/delivery/goals/common/httpServiceGoals";
import { LibraryGoals } from "../../common/delivery/goals/common/libraryGoals";
import {
    NpmBuildGoals,
    NpmDeployGoals,
    NpmDockerGoals,
    NpmKubernetesDeployGoals,
} from "../../common/delivery/goals/common/npmGoals";
import { Goals } from "../../common/delivery/goals/Goals";
import { DoNotSetAnyGoals } from "../../common/listener/PushMapping";
import { HasTravisFile } from "../../common/listener/support/pushtest/ci/ciPushTests";
import {
    AnyPush,
    FromAtomist,
    ToDefaultBranch,
    ToPublicRepo,
} from "../../common/listener/support/pushtest/commonPushTests";
import { IsDeployEnabled } from "../../common/listener/support/pushtest/deployPushTests";
import { HasDockerfile } from "../../common/listener/support/pushtest/docker/dockerPushTests";
import { IsLein, IsMaven } from "../../common/listener/support/pushtest/jvm/jvmPushTests";
import { MaterialChangeToJavaRepo } from "../../common/listener/support/pushtest/jvm/materialChangeToJavaRepo";
import { HasSpringBootApplicationClass } from "../../common/listener/support/pushtest/jvm/springPushTests";
import { NamedSeedRepo } from "../../common/listener/support/pushtest/NamedSeedRepo";
import { MaterialChangeToNodeRepo } from "../../common/listener/support/pushtest/node/materialChangeToNodeRepo";
import {
    HasAtomistBuildFile,
    IsNode,
} from "../../common/listener/support/pushtest/node/nodePushTests";
import { HasCloudFoundryManifest } from "../../common/listener/support/pushtest/pcf/cloudFoundryManifestPushTest";
import { not } from "../../common/listener/support/pushtest/pushTestUtils";
import { createEphemeralProgressLog } from "../../common/log/EphemeralProgressLog";
import { lookFor200OnEndpointRootGet } from "../../common/verify/lookFor200OnEndpointRootGet";
import { isDeployEnabledCommand } from "../../handlers/commands/DisplayDeployEnablement";
import {
    disableDeploy,
    enableDeploy,
} from "../../handlers/commands/SetDeployEnablement";
import {
    cloudFoundryProductionDeploySpec,
    cloudFoundryStagingDeploySpec,
    EnableDeployOnCloudFoundryManifestAddition,
} from "../blueprint/deploy/cloudFoundryDeploy";
import { LocalExecutableJarDeployer } from "../blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { SuggestAddingCloudFoundryManifest } from "../blueprint/repo/suggestAddingCloudFoundryManifest";
import { addCloudFoundryManifest } from "../commands/editors/pcf/addCloudFoundryManifest";
import { addDemoEditors } from "../parts/demo/demoEditors";
import { DockerOptions } from "../parts/stacks/dockerSupport";
import {
    addJavaSupport,
    JavaSupportOptions,
} from "../parts/stacks/javaSupport";
import { addNodeSupport } from "../parts/stacks/nodeSupport";
import { addSpringSupport } from "../parts/stacks/springSupport";
import { addTeamPolicies } from "../parts/team/teamPolicies";

export type CloudFoundryMachineOptions = SoftwareDeliveryMachineOptions & JavaSupportOptions & DockerOptions;

/**
 * Assemble a machine that supports Java, Spring and Node and deploys to Cloud Foundry
 * See generatorConfig.ts to customize generation defaults.
 * @return {SoftwareDeliveryMachine}
 */
export function cloudFoundryMachine(options: CloudFoundryMachineOptions): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        "CloudFoundry software delivery machine",
        options,
        whenPushSatisfies(IsLein)
            .itMeans("Build a Clojure library")
            .setGoals(LibraryGoals),
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
            .itMeans("Build and deploy Node")
            .setGoals(NpmDeployGoals),
        whenPushSatisfies(IsNode, HasDockerfile, ToDefaultBranch, IsDeployEnabled)
            .itMeans("Docker deploy Node")
            .setGoals(NpmKubernetesDeployGoals),
        whenPushSatisfies(IsNode, HasDockerfile)
            .itMeans("Docker build Node")
            .setGoals(NpmDockerGoals),
        whenPushSatisfies(IsNode, not(HasDockerfile))
            .itMeans("Build Node")
            .setGoals(NpmBuildGoals),
    );

    const runBuildBuilder = nodeRunBuildBuilder(options.projectLoader);
    const runCompileBuilder = nodeRunCompileBuilder(options.projectLoader);

    sdm.addBuildRules(
        build.when(HasAtomistBuildFile)
            .itMeans("Custom build script")
            .set(npmCustomBuilder(options.artifactStore, options.projectLoader)),
        build.when(IsNode, ToDefaultBranch)
            .itMeans("Try standard node build")
            .set(runBuildBuilder),
        build.when(IsLein)
            .itMeans("Lein build")
            .set(leinBuilder(options.projectLoader)),
        build.when(IsNode)
            .itMeans("Just compile")
            .set(runCompileBuilder),
        build.setDefault(new MavenBuilder(options.artifactStore,
            createEphemeralProgressLog, options.projectLoader)));
    sdm.addDeployRules(
        deploy.when(IsMaven)
            .itMeans("Maven test")
            .deployTo(StagingDeploymentGoal, StagingEndpointGoal, StagingUndeploymentGoal)
            .using(
                {
                    deployer: LocalExecutableJarDeployer,
                    targeter: ManagedDeploymentTargeter,
                },
            ),
        deploy.when(IsMaven)
            .itMeans("Maven production")
            .deployTo(ProductionDeploymentGoal, ProductionEndpointGoal, ProductionUndeploymentGoal)
            .using(cloudFoundryProductionDeploySpec(options)),
        deploy.when(IsNode)
            .itMeans("Node test")
            .deployTo(StagingDeploymentGoal, StagingEndpointGoal, StagingUndeploymentGoal)
            .using(cloudFoundryStagingDeploySpec(options)),
    );
    sdm.addDisposalRules(
        whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, HasCloudFoundryManifest)
            .itMeans("Java project to undeploy from PCF")
            .setGoals(UndeployEverywhereGoals),
        whenPushSatisfies(IsNode, HasCloudFoundryManifest)
            .itMeans("Node project to undeploy from PCF")
            .setGoals(UndeployEverywhereGoals),
        whenPushSatisfies(AnyPush)
            .itMeans("We can always delete the repo")
            .setGoals(RepositoryDeletionGoals));
    sdm.addChannelLinkListeners(SuggestAddingCloudFoundryManifest)
        .addSupportingCommands(
            () => addCloudFoundryManifest,
            enableDeploy,
            disableDeploy,
            isDeployEnabledCommand,
        )
        .addCodeReactions(EnableDeployOnCloudFoundryManifestAddition)
        .addEndpointVerificationListeners(lookFor200OnEndpointRootGet());
    addJavaSupport(sdm, options);
    addSpringSupport(sdm, options);
    addNodeSupport(sdm, options);
    addTeamPolicies(sdm);
    addDemoEditors(sdm);
    return sdm;
}
