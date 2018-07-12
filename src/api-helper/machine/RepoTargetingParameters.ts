import { RepoTargets } from "../../api/machine/RepoTargets";

export interface RepoTargetingParameters {

    targets: RepoTargets;
}

export function isRepoTargetingParameters(p: any): p is RepoTargetingParameters {
    return !!p && !!(p as RepoTargetingParameters).targets;
}
