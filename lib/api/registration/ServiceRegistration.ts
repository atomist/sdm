import { RepoContext } from "../context/SdmContext";
import { SdmGoalEvent } from "../goal/SdmGoalEvent";

/**
 * Key under which services can be found in goal data.
 */
export const GoalDataServiceKey = "sdm/service";

/**
 * Register additional services for a goal.
 * This can be used to add additional containers into k8s jobs to use during goal execution.
 */
export interface ServiceRegistration<T> {
    name: string;
    service: (goalEvent: SdmGoalEvent, repo: RepoContext) => Promise<{ type: string, spec: T } | undefined>;
}
