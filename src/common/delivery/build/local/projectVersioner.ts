import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { ProjectLoader } from "../../../repo/ProjectLoader";
import { ExecuteGoalResult } from "../../goals/goalExecution";
import {
    ExecuteGoalWithLog,
    RunWithLogContext
} from "../../goals/support/reportGoalError";

export type ProjectVersioner = (p: GitProject, log: ProgressLog) => Promise<any>;

/**
 * Version the project with a build specific version number
 * @param projectLoader used to load projects
 */
export function executeVersioner(projectLoader: ProjectLoader,
                                 projectVersioner: ProjectVersioner): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext): Promise<ExecuteGoalResult> => {
        const { credentials, id, context, progressLog } = rwlc;

        return projectLoader.doWithProject({ credentials, id, context, readOnly: true }, async p => {
            return projectVersioner(p, progressLog);
        });
    };
}
