
import { BaseParameter } from "@atomist/automation-client/internal/metadata/decoratorSupport";

export const SemVerRegExp: Partial<BaseParameter> = {
    displayName: "Version",
    description: "initial version of the project, e.g., 1.2.3-SNAPSHOT",
    pattern: /^.*$/,
    validInput: "a valid semantic version, http://semver.org",
    minLength: 1,
    maxLength: 50,
};
