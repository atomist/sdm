import { toEditModeFactory } from "@atomist/automation-client/operations/edit/editModes";
import { CodeTransformRegistration, CodeTransformRegistrationDecorator } from "../../../api/registration/CodeTransformRegistration";

export const DryRunMessage = "[atomist-dry-run]";

/**
 * Return a function wrapping a CodeTransform function to perform dry run editing
 * @return {CodeTransformRegistration}
 */
export const dryRun: CodeTransformRegistrationDecorator<any> =
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
