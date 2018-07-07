import { toEditModeFactory } from "@atomist/automation-client/operations/edit/editModes";
import { CodeTransformRegistration, CodeTransformRegistrationDecorator } from "../../../api/registration/CodeTransformRegistration";

export const DryRunMessage = "[atomist-dry-run]";

/**
 * Return a function wrapping a CodeTransform function to make
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
