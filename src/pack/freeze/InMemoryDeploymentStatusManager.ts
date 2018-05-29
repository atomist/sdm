import { DeploymentStatusManager } from "./deploymentFreeze";

/**
 * Demo implementation of DeploymentStatusManager that works only on this SDM node using local state
 */
export class InMemoryDeploymentStatusManager implements DeploymentStatusManager {

    private frozen = false;

    get isFrozen() {
        return Promise.resolve(this.frozen);
    }

    public setFrozen(f: boolean) {
        this.frozen = f;
    }
}
