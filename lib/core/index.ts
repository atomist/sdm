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

export { GitHubCredentialsResolver } from "./handlers/common/GitHubCredentialsResolver";
export { ConfigurationBasedBasicCredentialsResolver } from "./handlers/common/ConfigurationBasedBasicCredentialsResolver";
export { Tag } from "./goal/common/Tag";
export { Version, ProjectVersionerRegistration } from "./goal/common/Version";
export {
    Container,
    container,
    ContainerPort,
    ContainerProjectHome,
    ContainerRegistration,
    ContainerScheduler,
    ContainerSpecCallback,
    ContainerVolumeMount,
    GoalContainer,
    GoalContainerVolume,
} from "./goal/container/container";
export { DockerContainerRegistration } from "./goal/container/docker";
export { hasRepositoryGoals, repositoryDrivenContainer } from "./goal/container/repositoryDrivenContainer";
export { DisplayDeployEnablement } from "./handlers/commands/DisplayDeployEnablement";
export {
    DisableDeploy,
    EnableDeploy,
    setDeployEnablement,
    SetDeployEnablementParameters,
} from "./handlers/commands/SetDeployEnablement";
export { DefaultRepoRefResolver } from "./handlers/common/DefaultRepoRefResolver";
export { createGitTag, CreateGitTagOptions, executeTag, ExecuteTagOptions } from "./delivery/build/executeTag";
export { ProjectIdentifier } from "./delivery/build/local/projectIdentifier";
export {
    executeVersioner,
    getGoalVersion,
    GetGoalVersionArguments,
    goalInvocationVersion,
    ProjectVersioner,
    readSdmVersion,
} from "./delivery/build/local/projectVersioner";
export { ConfigureOptions, configureSdm, SoftwareDeliveryMachineMaker } from "./machine/configureSdm";
export {
    LocalSoftwareDeliveryMachineConfiguration,
    LocalSoftwareDeliveryMachineOptions,
} from "./machine/LocalSoftwareDeliveryMachineOptions";
export { isInLocalMode, isGitHubAction, IsGitHubAction, IsInLocalMode } from "./machine/modes";
export { constructLogPath } from "./log/DashboardDisplayProgressLog";
export { RolarProgressLog } from "./log/RolarProgressLog";
export { createSoftwareDeliveryMachine } from "./machine/machineFactory";
export { ToPublicRepo } from "./mapping/pushtest/toPublicRepo";
export {
    CoreRepoFieldsAndChannels,
    OnChannelLink,
    OnRepoOnboarded,
    PersonByChatId,
    SdmVersionForCommit,
} from "../typings/types";
import * as github from "./util/github/ghub";

export { github };
export { tagRepo } from "./util/github/tagRepo";
export { fetchBranchTips, tipOfBranch } from "./util/graph/queryCommits";
export { truncateCommitMessage } from "./util/lifecycleHelpers";
export { toArray } from "./util/misc/array";
export { renderCommitMessage } from "./util/slack/diffRendering";
export * from "./util/webhook/ImageLink";
export { Preference, AbstractPreferenceStore } from "./preferences/AbstractPreferenceStore";
export { FilePreferenceStoreFactory } from "./preferences/FilePreferenceStore";
export { TeamConfigurationPreferenceStoreFactory } from "./preferences/TeamConfigurationPreferenceStore";
export { FileSystemGoalCacheArchiveStore } from "./goal/cache/FileSystemGoalCacheArchiveStore";
export { CompressingGoalCache, GoalCacheArchiveStore } from "./goal/cache/CompressingGoalCache";
export { NoOpGoalCache } from "./goal/cache/NoOpGoalCache";
export { cachePut, cacheRemove, cacheRestore, GoalCache, GoalCacheOptions } from "./goal/cache/goalCaching";
export {
    configure,
    Configurer,
    GoalData,
    GoalStructure,
    CreateGoals,
    GoalConfigurer,
    GoalCreator,
    ConfigurationPreProcessor,
    ConfigureMachineOptions,
    DeliveryGoals,
} from "./machine/configure";
export {
    configureYaml,
    ConfigureYamlOptions,
    ConfigurationMaker,
    CommandMaker,
    EventMaker,
} from "./machine/yaml/configureYaml";
export { GoalMaker } from "./machine/yaml/mapGoals";
export { PushTestMaker } from "./machine/yaml/mapPushTests";
