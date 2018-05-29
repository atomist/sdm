/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BaseParameter } from "@atomist/automation-client/internal/metadata/decoratorSupport";

/**
 * Validation pattern for Java identifiers
 * @type {{description: string; pattern: RegExp; validInput: string; minLength: number; maxLength: number}}
 */
export const JavaIdentifierRegExp: Partial<BaseParameter> = {
    description: "valid Java identifier name",
    pattern: /^([$a-zA-Z_][\w$]*)*$/,
    validInput: "a valid Java identifier",
    minLength: 1,
    maxLength: 150,
};

export const JavaPackageRegExp: Partial<BaseParameter> = {
    displayName: "Root Package",
    description: "root package for your generated source, often this will be namespaced under the group ID",
    pattern: /^([a-zA-Z_][.\w]*)*$/,
    validInput: "valid java package name",
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
