import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ChildProcess } from "child_process";

export interface BranchRepoRef extends RemoteRepoRef {
    branch?: string;
}

export function isBranchRepoRef(rr: RemoteRepoRef): rr is BranchRepoRef {
    return !!(rr as BranchRepoRef).branch;
}

/**
 * Ports will be reused for the same app
 */
export interface DeployedApp {

    id: BranchRepoRef;

    port: number;

    /** Will be undefined if the app is not currently deployed */
    childProcess: ChildProcess;
}

/**
 * Manages deployments
 * This is not intended for production use
 * @type {Array}
 */
export class ManagedDeployments {

    private deployments: DeployedApp[] = [];

    constructor(public initialPort: number) {
    }

    /**
     * Find a new port for this app
     * @param {RemoteRepoRef} id
     * @return {number}
     */
    public findPort(id: RemoteRepoRef): number {
        const running = isBranchRepoRef(id) ?
            this.deployments
                .find(d => d.id.owner === id.owner && d.id.repo === id.repo && d.id.branch === id.branch) :
            this.deployments
                .find(d => d.id.owner === id.owner && d.id.repo === id.repo);
        return !!running ? running.port : this.nextFreePort();
    }

    public async recordDeployment(da: DeployedApp) {
        logger.info("Recording app [%j] on port [%d]", da.port);
        this.deployments.push(da);
    }

    /**
     * Terminate any process we're managing on behalf of this id
     * @param {BranchRepoRef} id
     * @return {Promise<any>}
     */
    public async terminateIfRunning(id: BranchRepoRef): Promise<any> {
        const victim = this.deployments.find(d => d.id.sha === id.sha ||
            (d.id.owner === id.owner && d.id.repo === id.repo && !!id.branch && d.id.branch === id.branch));
        if (!!victim) {
            victim.childProcess.kill();
            // Keep the port but deallocate the process
            victim.childProcess = undefined;
            logger.info("Killed app [%j] with pid %d, but continuing to reserve port [%d]",
                id, victim.childProcess.pid, victim.port);
        } else {
            logger.info("Was asked to kill app [%j], but no eligible process found", id);
        }
    }

    private nextFreePort(): number {
        let port = this.initialPort;
        while (this.deployments.some(d => d.port === port)) {
            port++;
        }
        return port;
    }

}
