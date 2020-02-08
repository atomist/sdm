import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { pRateLimit } from "p-ratelimit";
import { Quota } from "p-ratelimit/build/src/quota/quota";
import { QuotaManager } from "p-ratelimit/build/src/quota/quotaManager";
import {
    ProjectLoader,
    ProjectLoadingParameters,
} from "../../spi/project/ProjectLoader";

export class RateLimitingProjectLoader implements ProjectLoader {

    private readonly limit: (fn: () => Promise<any>) => Promise<any>;

    constructor(private readonly delegate: ProjectLoader,
                quota: QuotaManager | Quota) {
        this.limit = pRateLimit(quota);
    }

    public async doWithProject<T>(params: ProjectLoadingParameters, action: (p: GitProject) => Promise<T>): Promise<T> {
        return this.limit(() => this.delegate.doWithProject(params, action));
    }
}
