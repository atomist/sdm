import { BaseParameter } from "@atomist/automation-client/internal/metadata/decoratorSupport";

export const JavaPackageRegExp: Partial<BaseParameter> = {
    displayName: "Root Package",
    description: "root package for your generated source, often this will be namespaced under the group ID",
    pattern: /^([a-zA-Z_][.\w]*)*$/,
    validInput: "a valid Git branch name, see" +
    " https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html",
    minLength: 0,
    maxLength: 150,
};

export const MavenArtifactIdRegExp: Partial<BaseParameter> = {
    displayName: "Maven Artifact ID",
    description: "Maven artifact identifier, i.e., the name of the jar without the version." +
    " Defaults to the project name",
    pattern: /^([a-z][-a-z0-9_]*)$/,
    validInput: "a valid Maven artifact ID, which starts with a lower-case letter and contains only " +
    " alphanumeric, -, and _ characters. Defaults to project name",
    minLength: 1,
    maxLength: 50,
};

export const MavenGroupIdRegExp: Partial<BaseParameter> = {
    displayName: "Maven Group ID",
    description: "Maven group identifier, often used to provide a namespace for your project," +
    " e.g., com.pany.team",
    pattern: /^([A-Za-z\-_][A-Za-z0-9_\-.]*)$/,
    validInput: "a valid Maven group ID, which starts with a letter, -, or _ and contains only" +
    " alphanumeric, -, and _ characters and may having leading period separated identifiers starting" +
    " with letters or underscores and containing only alphanumeric and _ characters.",
    minLength: 1,
    maxLength: 50,
};
