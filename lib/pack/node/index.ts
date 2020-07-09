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

export { TslintAutofix } from "./autofix/typescript/tslintAutofix";
export { EslintAutofix } from "./autofix/eslintAutofix";
export { npmAuditAutofix } from "./autofix/npmAuditAutofix";
export { PackageJsonFormatingAutofix } from "./autofix/packageJsonFormat";
export { PackageLockUrlRewriteAutofix } from "./autofix/packageLockUrlRewriteAutofix";
export { AddThirdPartyLicenseAutofix } from "./autofix/thirdPartyLicense";

export { EslintInspection, esLintReviewCategory } from "./inspection/eslint";
export { TslintAutoInspectRegistration, TslintInspection, tsLintReviewCategory } from "./inspection/tslint";
export { NpmAuditAutoInspectRegistration, npmAuditInspection, npmAuditReviewCategory } from "./inspection/npmAudit";

export { nodeSupport, NodeSupportOptions, NodeConfiguration } from "./nodeSupport";

export { TryToUpdateDependency } from "./transform/tryToUpdateDependency";
export { UpdatePackageJsonIdentification } from "./transform/updatePackageJsonIdentification";
export { UpdatePackageVersion } from "./transform/updatePackageVersion";
export { UpdateReadmeTitle } from "./transform/updateReadmeTitle";

export {
    NodeProjectCreationParametersDefinition,
    NodeProjectCreationParameters,
} from "./generator/NodeProjectCreationParameters";

export { IsNode } from "./pushtest/nodePushTests";
export { IsTypeScript } from "./pushtest/tsPushTests";
export { NodeProjectIdentifier } from "./build/nodeProjectIdentifier";
export { NpmOptions, deleteBranchTag, executePublish, gitBranchToNpmTag, configureNpmRc } from "./build/executePublish";
export { IsAtomistAutomationClient } from "./pushtest/nodePushTests";
export {
    NodeProjectVersioner,
    NpmVersioner,
    NpmVersionerRegistration,
    NpmVersionIncrementer,
    NpmVersionIncrementerRegistration,
} from "./build/npmVersioner";
export { NpmProgressReporter, NpmProgressTests } from "./build/npmProgressReporter";
export { NodeDefaultOptions } from "./build/nodeOptions";
export * from "./autofix/eslintAutofix";
export {
    npmCompilePreparation,
    npmInstallPreparation,
    npmVersionPreparation,
    NpmInstallProjectListener,
    NpmCompileProjectListener,
    NpmVersionProjectListener,
    NpmNodeModulesCachePut,
    NpmNodeModulesCacheRestore,
    TypeScriptCompileCachePut,
    TypeScriptCompileCacheRestore,
} from "./listener/npm";
export { DevelopmentEnvOptions } from "./npm/spawn";
export { PackageJson } from "./util/PackageJson";
