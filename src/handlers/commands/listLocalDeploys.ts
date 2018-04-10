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

import { HandleCommand, HandlerContext, Success } from "@atomist/automation-client";
import { commandHandlerFrom, OnCommand } from "@atomist/automation-client/onCommand";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { EmptyParameters } from "../../common/command/EmptyParameters";
import { DeployedApp, ManagedDeployments } from "../../common/delivery/deploy/local/appManagement";
import { managedExecutableJarDeployments } from "../../common/delivery/deploy/local/jar/executableJarDeployer";
import { managedMavenDeployments } from "../../common/delivery/deploy/local/maven/mavenSourceDeployer";

/**
 * Return a command handler that can list local deploys
 * @return {HandleCommand<EmptyParameters>}
 */
export const listLocalDeploys: Maker<HandleCommand> =
    () => commandHandlerFrom(
        handleListDeploys(),
        EmptyParameters,
        "listLocalDeploys",
        "list local deploys",
        "list local deploys");

function handleListDeploys(): OnCommand {
    return async ctx => {
        await handleListDeploysWith("Maven source deployer", managedMavenDeployments, ctx);
        await handleListDeploysWith("Executable JAR deployer", managedExecutableJarDeployments, ctx);
        return Success;
    };
}

async function handleListDeploysWith(description: string, managedDeployments: ManagedDeployments, ctx: HandlerContext) {
    const message = `*${description}* managing ${managedDeployments.deployments.length} deployments:\n${
        managedDeployments.deployments.map(deployedAppToString).join("\n")}`;
    await ctx.messageClient.respond(message);
}

function deployedAppToString(da: DeployedApp) {
    return `${da.id.owner}:${da.id.repo}:${da.id.branch}@${da.id.sha} -  ${da.deployment.endpoint};port=${da.port};pid=${
        !!da.childProcess ? da.childProcess.pid : "<not running>"}`;
}
