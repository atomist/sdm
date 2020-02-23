/*
 * Copyright © 2020 Atomist, Inc.
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

import * as changeCase from "change-case";
import { hasCommit } from "../../../api-helper/pushtest/commit";
import { isMaterialChange } from "../../../api-helper/pushtest/materialChangeTest";
import { StatefulPushListenerInvocation } from "../../../api/dsl/goalContribution";
import { isGoal } from "../../../api/mapping/goalTest";
import { isOutput } from "../../../api/mapping/outputTest";
import {
    pushTest,
    PushTest,
} from "../../../api/mapping/PushTest";
import {
    hasFile,
    hasFileContaining,
    hasResourceProvider,
    isBranch,
    isRepo,
    ToDefaultBranch,
} from "../../../api/mapping/support/commonPushTests";
import {
    and,
    not,
    or,
} from "../../../api/mapping/support/pushTestUtils";
import { SdmGoalState } from "../../../typings/types";
import { isSkillConfigured } from "../../mapping/pushtest/isSkillConfigured";
import { toArray } from "../../util/misc/array";
import { camelCase } from "./util";

export type PushTestMaker<G extends Record<string, any> = any> =
    (params: G) => ((pli: StatefulPushListenerInvocation) => Promise<boolean>) | Promise<PushTest> | PushTest;

export async function mapTests(tests: any,
                               additionalTests: Record<string, PushTest>,
                               extensionTests: Record<string, PushTestMaker>): Promise<PushTest | PushTest[]> {
    const newTests = [];
    for (const t of toArray(tests || [])) {
        const test = typeof t !== "string" && !Array.isArray(t) ? camelCase(t) : t as any;
        newTests.push(await mapTest(test, additionalTests, extensionTests));
    }
    return newTests;
}

type CreatePushTest = (test: any,
                       additionalTests: Record<string, PushTest>,
                       extensionTests: Record<string, PushTestMaker>) => Promise<PushTest | undefined>;

const HasFile: CreatePushTest = async test => {
    if (!!test.hasFile) {
        return hasFile(test.hasFile);
    }
    return undefined;
};

const IsRepo: CreatePushTest = async test => {
    if (!!test.isRepo) {
        return isRepo(typeof test.isRepo === "string" ? new RegExp(test.isRepo) : test.isRepo);
    }
    return undefined;
};

const IsBranch: CreatePushTest = async test => {
    if (!!test.isBranch) {
        return isBranch(typeof test.isBranch === "string" ? new RegExp(test.isBranch) : test.isBranch);
    }
    return undefined;
};

const IsDefaultBranch: CreatePushTest = async test => {
    if (["isDefaultBranch", "toDefaultBranch"].includes(changeCase.camel(test))) {
        return ToDefaultBranch;
    }
    return undefined;
};

const IsSkillConfigured: CreatePushTest = async test => {
    if (!!test.isSkillConfigured) {
        const sc = test.isSkillConfigured;
        return isSkillConfigured({
            hasCommit: sc.hasCommit,
            hasFile: sc.hasFile,
            isBranch: sc.isBranch,
            isDefaultBranch: sc.isDefaultBranch,
        });
    }
    return undefined;
};

const IsGoal: CreatePushTest = async (test, additionalTests, extensionTests) => {
    const onGoal = test.isGoal || test.onGoal;
    if (!!onGoal) {
        return isGoal({
            name: getStringOrRegexp(onGoal.name),
            state: onGoal.state || SdmGoalState.success,
            pushTest: onGoal.test ? await mapTest(onGoal.test, additionalTests, extensionTests) : undefined,
            output: getStringOrRegexp(onGoal.output),
            data: getStringOrRegexp(onGoal.data),
        });
    }
    return undefined;
};

const IsOutput: CreatePushTest = async (test, additionalTests, extensionTests) => {
    const onOutput = test.isOutput || test.onOutput;
    if (!!onOutput) {
        return isOutput({
            classifier: getStringOrRegexp(onOutput.classifier),
            type: onOutput.type,
            pushTest: onOutput.test ? await mapTest(onOutput.test, additionalTests, extensionTests) : undefined,
        });
    }
    return undefined;
};

const IsMaterialChange: CreatePushTest = async test => {
    if (!!test.isMaterialChange) {
        return isMaterialChange({
            directories: toArray(test.isMaterialChange.directories),
            extensions: toArray(test.isMaterialChange.extensions),
            files: toArray(test.isMaterialChange.files),
            globs: getGlobPatterns(test.isMaterialChange),
        });
    }
    return undefined;
};

const HasFileContaining: CreatePushTest = async test => {
    if (!!test.hasFileContaining) {
        if (!test.hasFileContaining.content) {
            throw new Error("Push test 'hasFileContaining' can't be used without 'content' property");
        }
        return hasFileContaining(
            getGlobPatterns(test.hasFileContaining) || "**/*",
            typeof test.hasFileContaining.content === "string" ? new RegExp(test.hasFileContaining.content) : test.hasFileContaining.content);
    }
    return undefined;
};

const HasResourceProvider: CreatePushTest = async test => {
    if (!!test.hasResourceProvider) {
        if (!test.hasResourceProvider.type) {
            throw new Error("Push test 'hasResourceProvider' can't be used without 'type' property");
        }
        return hasResourceProvider(test.hasResourceProvider.type, test.hasResourceProvider.name);
    }
    return undefined;
};

const HasCommit: CreatePushTest = async test => {
    if (!!test.hasCommit) {
        return hasCommit(typeof test.hasCommit === "string" ? new RegExp(test.hasCommit) : test.hasCommit);
    }
    return undefined;
};

const Not: CreatePushTest = async (test, additionalTests, extensionTests) => {
    if (!!test.not) {
        return not(await mapTest(test.not, additionalTests, extensionTests));
    }
    return undefined;
};

const And: CreatePushTest = async (test, additionalTests, extensionTests) => {
    if (!!test.and) {
        return and(...toArray(await mapTests(test.and, additionalTests, extensionTests)));
    }
    return undefined;
};

const Or: CreatePushTest = async (test, additionalTests, extensionTests) => {
    if (!!test.or) {
        return or(...toArray(await mapTests(test.or, additionalTests, extensionTests)));
    }
    return undefined;
};

const AdditionalTest: CreatePushTest = async (test, additionalTests) => {
    if (!!test.use && !!additionalTests[test.use]) {
        return additionalTests[test.use];
    }
    return undefined;
};

const FunctionTest: CreatePushTest = async test => {
    if (typeof test === "function") {
        return pushTest(test.toString(), test);
    }
    return undefined;
};

const ExtensionTest = async (test, additionalTests, extensionTests) => {
    for (const extTestName in extensionTests) {
        if (test.use === extTestName) {
            const extTest = await extensionTests[extTestName](test.parameters || {});
            if (!!extTest.name && !!extTest.mapping) {
                return extTest;
            } else {
                return pushTest(extTestName, extTest);
            }
        }
    }
    return undefined;
};

export const CreatePushTests = [
    HasFile,
    IsRepo,
    IsBranch,
    IsDefaultBranch,
    IsGoal,
    IsOutput,
    IsSkillConfigured,
    IsMaterialChange,
    HasFileContaining,
    HasResourceProvider,
    HasCommit,
    Not,
    And,
    Or,
    AdditionalTest,
    FunctionTest,
    ExtensionTest,
];

export async function mapTest(test: any,
                              additionalTests: Record<string, PushTest>,
                              extensionTests: Record<string, PushTestMaker>): Promise<PushTest> {
    for (const createPushTest of CreatePushTests) {
        const pt = await createPushTest(test, additionalTests, extensionTests);
        if (!!pt) {
            return pt;
        }
    }
    throw new Error(`Unable to construct push test from '${JSON.stringify(test)}'`);
}

function getGlobPatterns(test: any): string[] {
    const pattern = test.globPattern || test.pattern || test.globPatterns || test.patterns;
    return toArray(pattern);
}

function getStringOrRegexp(toTest: string | { regexp: string }): string | RegExp | undefined {
    if (!toTest) {
        return undefined;
    } else if (typeof toTest === "string") {
        return toTest;
    } else if (toTest.regexp !== undefined) {
        return new RegExp(toTest.regexp);
    } else {
        return undefined;
    }
}
