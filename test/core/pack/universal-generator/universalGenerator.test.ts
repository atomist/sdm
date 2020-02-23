/*
 * Copyright © 2019 Atomist, Inc.
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

import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import * as assert from "assert";
import { GeneratorRegistration } from "../../../../lib/api/registration/GeneratorRegistration";
import { UniversalTransform } from "../../../../lib/core/pack/universal-generator/generatorSupport";
import {
    AssertGeneratorResult,
    assertUniversalGenerator,
} from "../../../../lib/core/pack/universal-generator/test/assertGenerator";

const SpringGeneratorRegistration: GeneratorRegistration<{ name: string }> = {
    name: "SpringBootGenerator",
    intent: "create spring",
    startingPoint: GitHubRepoRef.from({ owner: "atomist-seeds", repo: "spring-rest", branch: "master" }),
    parameters: {
        name: {},
    },
    transform: async (p, papi: any) => {
        await p.addFile("params", `${papi.parameters.name} was here`);
    },
};

const Trans1UniversalTransform: UniversalTransform<{ firstName: string }> = {
    parameters: {
        firstName: {},
    },
    test: async p => true,
    transforms: async (p, papi: any) => {
        await p.addFile("trans1", `${papi.parameters.firstName} ${papi.parameters.name} was here`);
    },
};

describe("universalGenerator", () => {

    it("should fail to generate project with missing initial parameters", async () => {

        const params = {
            target: {
                owner: "sdm-org",
                repo: "test",
            },
        };

        try {
            await assertUniversalGenerator(
                SpringGeneratorRegistration,
                Trans1UniversalTransform,
                params);
            assert.fail();
        } catch (e) {
            assert(e.message === "Parameter 'name' required but missing in invocation to 'SpringBootGenerator'");
        }

    });

    it("should fail to generate project with missing additional parameters", async () => {

        const params = {
            target: {
                owner: "sdm-org",
                repo: "test",
            },
            name: "Mouse",
        };

        try {
            await assertUniversalGenerator(
                SpringGeneratorRegistration,
                Trans1UniversalTransform,
                params);
            assert.fail();
        } catch (e) {
            assert(e.message.includes("firstName"));
        }

    }).timeout(10000);

    it("should generate project with only initial", async () => {

        const params = {
            target: {
                owner: "sdm-org",
                repo: "test",
            },
            name: "Mouse",
            firstName: "Mickey",
        };

        const result = await assertUniversalGenerator(
            SpringGeneratorRegistration,
            Trans1UniversalTransform,
            params);

        await assertGeneratorResult(result);

    }).timeout(10000);

    it("should generate project with initial and additional parameters", async () => {

        const params = {
            target: {
                owner: "sdm-org",
                repo: "test",
            },
            name: "Mouse",
        };

        const promptForParams = {
            firstName: "Mickey",
        };

        const result = await assertUniversalGenerator(
            SpringGeneratorRegistration,
            Trans1UniversalTransform,
            params,
            promptForParams);

        await assertGeneratorResult(result);

    }).timeout(10000);
});

async function assertGeneratorResult(result: AssertGeneratorResult): Promise<void> {
    const project = result.project;
    const id = result.id;

    assert.deepStrictEqual(await project.hasFile("params"), true);
    assert.deepStrictEqual(await ((await project.getFile("params"))).getContent(), "Mouse was here");
    assert.deepStrictEqual(await project.hasFile("trans1"), true);
    assert.deepStrictEqual(await ((await project.getFile("trans1"))).getContent(), "Mickey Mouse was here");

    assert.deepStrictEqual(id.owner, "sdm-org");
    assert.deepStrictEqual(id.repo, "test");
}
