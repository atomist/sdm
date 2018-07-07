import { isPullRequest, toEditModeFactory } from "@atomist/automation-client/operations/edit/editModes";
import { CodeTransformRegistration, CodeTransformRegistrationDecorator } from "../../../api/registration/CodeTransformRegistration";

export const DryRunMessage = "[atomist-dry-run]";

/**
 * Return a function wrapping a CodeTransform registration to make
 * it build aware: That is, perform a dry run branch push first
 * and create a PR or issue depending on the build result.
 * @return {CodeTransformRegistration}
 */
export const makeBuildAware: CodeTransformRegistrationDecorator<any> =
    ctr => {
        // Works by putting in a special commit message
        const dryRunRegistration: CodeTransformRegistration<any> = {
            ...ctr,
        };
        if (!!ctr.editMode) {
            const registeredEm = toEditModeFactory(ctr.editMode);
            dryRunRegistration.editMode = p => {
                const em = registeredEm(p);
                // Add a dry run message
                em.message = `${em.message}\n\n${DryRunMessage}`;
                if (isPullRequest(em)) {
                    // Don't let it raise a PR if it wanted to.
                    // It will remain a valid BranchCommit
                    em.title = em.body = undefined;
                }
                return em;
            };
        } else {
            // No edit mode was set. We need to set one that sets a branch:
            // No PR for now
            dryRunRegistration.editMode = () => {
                const branch = `${ctr.name}-${new Date().getTime()}`;
                const message = `${ctr.name}\n\n${DryRunMessage}`;
                return { branch, message };
            };
            return dryRunRegistration;
        }
    };
