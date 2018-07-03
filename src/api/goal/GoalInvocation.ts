import { ProgressLog } from "../../spi/log/ProgressLog";
import { StatusForExecuteGoal } from "../../typings/types";
import { RepoContext } from "../context/SdmContext";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { ExecuteGoalResult } from "./ExecuteGoalResult";
import { SdmGoalEvent } from "./SdmGoalEvent";


export type ExecuteGoal = (r: GoalInvocation) => Promise<ExecuteGoalResult>;

export type PrepareForGoalExecution = (p: GitProject, r: GoalInvocation) => Promise<ExecuteGoalResult>;

export interface GoalInvocation extends RepoContext {

    sdmGoal: SdmGoalEvent;

    progressLog: ProgressLog;

    /**
     * @deprecated use sdmGoal instead.
     */
    status: StatusForExecuteGoal.Fragment;

}
