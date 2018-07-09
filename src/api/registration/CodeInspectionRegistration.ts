import { CommandDetails } from "@atomist/automation-client/operations/CommandDetails";
import { FallbackParams } from "@atomist/automation-client/operations/common/params/FallbackParams";
import { RepoFilter } from "@atomist/automation-client/operations/common/repoFilter";
import { Project } from "@atomist/automation-client/project/Project";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { CommandListenerInvocation } from "../listener/CommandListener";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Function that can run against a project without mutating it to
 * compute a value.
 */
export type CodeInspection<R, P = any> = (p: Project,
                                          sdmc: CommandListenerInvocation<P>) => Promise<R>;

export interface CodeInspectionRegistration<R, PARAMS = NoParameters>
    extends Partial<CommandDetails>,
        CommandRegistration<PARAMS> {

    inspection: CodeInspection<R, PARAMS>;

    /**
     * Allow customization of the repositories that an inspection targets.
     */
    targets?: FallbackParams;

    repoFilter?: RepoFilter;

    /**
     * React to computed values from running across one or more projects
     * @param {R[]} results
     * @return {Promise<any>}
     */
    react?(results: R[]): Promise<any>;

}
