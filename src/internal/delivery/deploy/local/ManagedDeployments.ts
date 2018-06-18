/*
 * Copyright © 2018 Atomist, Inc.
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

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef, RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import axios from "axios";
import { ChildProcess } from "child_process";
import * as https from "https";
import { poisonAndWait } from "../../../../api-helper/misc/spawned";
import { Deployment, TargetInfo } from "../../../../spi/deploy/Deployment";
import { Targeter } from "../../../../spi/deploy/Target";

export interface ManagedDeploymentTargetInfo extends TargetInfo {
    managedDeploymentKey: RemoteRepoRef;
}

export const ManagedDeploymentTargeter: Targeter<ManagedDeploymentTargetInfo> = (id: RemoteRepoRef, branch: string) => {
    const branchId = {...id, branch};
    return {
        name: "Run alongside this automation",
        description: `Locally run ${id.sha} from branch ${branch}`,
        managedDeploymentKey: branchId,
    };
};

/**
 * Strategy for looking up a service
 */
export enum LookupStrategy {
    service = "service",
    branch = "branch",
    sha = "sha",
}

/**
 * Ports will be reused for the same app
 */
export interface DeployedApp {

    id: RepoRef;

    port: number;

    /** Will be undefined if the app is not currently deployed */
    childProcess: ChildProcess;

    deployment: Deployment;

    lookupStrategy: LookupStrategy;
}

/**
 * Manages local deployments to the automation server node
 * This is not intended for production use
 * @type {Array}
 */
export class ManagedDeployments {

    public readonly deployments: DeployedApp[] = [];

    constructor(public initialPort: number) {
    }

    /**
     * Find the appropriate port for this app
     * @param {RemoteRepoRef} id
     * @param lookupStrategy strategy for looking up the instance
     * @param host it will be on. Check for ports not in use
     * @return {number}
     */
    public async findPort(id: RemoteRepoRef, lookupStrategy: LookupStrategy, host: string): Promise<number> {
        const running = this.findDeployment(id, lookupStrategy);
        return !!running ? running.port : this.nextFreePort(host);
    }

    public recordDeployment(da: DeployedApp) {
        logger.info("Recording app [%s:%s] on port [%d]", da.id.owner, da.id.repo, da.port);
        this.deployments.push(da);
    }

    public findDeployment(id: RemoteRepoRef, lookupStrategy: LookupStrategy): DeployedApp {
        switch (lookupStrategy) {
            case  LookupStrategy.sha :
                if (!id.sha) {
                    throw new Error("Sha should have been set to use 'sha' LookupStrategy");
                }
                // Probability of a sha collision is tiny
                return this.deployments.find(d => d.id.sha === id.sha);
            case LookupStrategy.branch :
                if (!id.branch) {
                    throw new Error("Branch should have been set to use 'branch' LookupStrategy");
                }
                return this.deployments
                    .find(d => d.id.owner === id.owner && d.id.repo === id.repo && d.id.branch === id.branch);
            case LookupStrategy.service:
                this.deployments
                    .find(d => d.id.owner === id.owner && d.id.repo === id.repo);
        }
    }

    /**
     * Terminate any process we're managing on behalf of this id
     * @param {RemoteRepoRef} id
     * @param lookupStrategy strategy for finding the instance
     * @return {Promise<any>}
     */
    public async terminateIfRunning(id: RemoteRepoRef, lookupStrategy: LookupStrategy): Promise<any> {
        const victim = this.findDeployment(id, lookupStrategy);
        if (!!victim && !!victim.childProcess) {
            await poisonAndWait(victim.childProcess);
            // Keep the port but deallocate the process
            logger.info("Killed app [%j] with pid %d, but continuing to reserve port [%d]",
                id, victim.childProcess.pid, victim.port);
            victim.childProcess = undefined;
        } else {
            logger.info("Was asked to kill app [%j], but no eligible process found", id);
        }
    }

    private async nextFreePort(host: string): Promise<number> {
        let port = this.initialPort;
        while (true) {
            if (this.deployments.some(d => d.port === port)) {
                port++;
            } else if (await portIsInUse(host, port)) {
                // Skip this port, too
                logger.warn("Unexpected: %s is serving on port %d", host, port);
                port++;
            } else {
                break;
            }
        }
        return port;
    }

}

async function portIsInUse(host: string, port: number) {
    const agent = new https.Agent({
        rejectUnauthorized: false,
    });
    try {
        await axios.head(`${host}:${port}`, {httpsAgent: agent});
        return true;
    } catch {
        return false;
    }
}
