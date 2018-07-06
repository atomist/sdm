import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { toEditModeFactory } from "@atomist/automation-client/operations/edit/editModes";
import { Issue } from "@atomist/automation-client/util/gitHub";
import { CodeTransformRegistration, CodeTransformRegistrationDecorator } from "../../../api/registration/CodeTransformRegistration";

export const DryRunMessage = "[atomist-dry-run]";

/**
 * Implemented by types that can raise issues
 */
export interface IssueRouter {

    raiseIssue(credentials: ProjectOperationCredentials, id: RemoteRepoRef,
               issue: Issue): Promise<any>;
}

export interface DryRunOptions {
    issueRouter: IssueRouter;
}

/**
 * Return a function wrapping a CodeTransform function to perform dry run editing
 * @return {CodeTransformRegistration}
 */
export function dryRunDecorator<PARAMS>(opts: DryRunOptions): CodeTransformRegistrationDecorator<PARAMS> {
    return ctr => {
        // Works by putting in a special commit message

        const dryRunRegistration: CodeTransformRegistration<any> = {
            ...ctr,
        };
        if (!!ctr.editMode) {
            const registeredEm = toEditModeFactory(ctr.editMode);
            dryRunRegistration.editMode = p => {
                const oldEm = registeredEm(p);
                // Add a dry run message
                oldEm.message = `${oldEm.message}\n\n${DryRunMessage}`;
                return oldEm;
            };
        } else {
            // No edit mode was set. We need one that sets a branch:
            // No PR for now
            dryRunRegistration.editMode = () => {
                const branch = `${ctr.name}-${new Date().getTime()}`;
                const message = `${ctr.name}\n\n${DryRunMessage}`;
                return { branch, message };
            };
            return dryRunRegistration;
        }
    };
}
