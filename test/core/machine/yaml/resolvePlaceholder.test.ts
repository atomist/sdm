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

import * as assert from "power-assert";
import { resolvePlaceholder } from "../../../../lib/core/machine/yaml/resolvePlaceholder";

describe("machine/yaml/resolvePlaceholder", () => {

    describe("resolvePlaceholder", () => {

        it("should replace text in value", async () => {
            // tslint:disable-next-line:no-invalid-template-strings
            const value = "The quick ${color} fox jumps over the ${attribute} dog";
            const result = await resolvePlaceholder(value, {} as any, {
                configuration: {
                    color: "brown",
                    attribute: "lazy",
                },
            } as any, {});
            assert.deepStrictEqual(result, "The quick brown fox jumps over the lazy dog");
        });

        it("should replace entire object", async () => {
            // tslint:disable-next-line:no-invalid-template-strings
            const value = "${colors}";
            const result = await resolvePlaceholder(value, {} as any, {
                configuration: {
                    colors: {
                        blue: "yes",
                        orange: "nah",
                    },
                },
            } as any, {});
            assert.deepStrictEqual(result, { blue: "yes", orange: "nah" });
        });

        it("should replace nested placeholders", async () => {
            // tslint:disable
            const value = "docker build . -f ${parameters.dockerfile:Dockerfile} -t ${parameters.registry:${push.repo.owner}}/${push.repo.name}:latest &&";
            // tslint:enable
            const result = await resolvePlaceholder(value, {
                push: {
                    repo: {
                        owner: "atomist",
                        name: "sdm",
                    },
                },
            } as any, {
                configuration: {},
            } as any, { dockerfile: "lib/Dockerfile" });
            assert.deepStrictEqual(result, "docker build . -f lib/Dockerfile -t atomist/sdm:latest &&");
        });

        it("should replace very nested placeholders", async () => {
            // tslint:disable
            const value = "          echo \"atm:phase=kaniko build\" &&\n" +
                "          /sdm/kaniko/executor\n" +
                "          --context=dir://$ATOMIST_PROJECT_DIR\n" +
                "          --destination=${parameters.registry:docker.pkg.github.com}/${parameters.image}:${parameters.tag:${push.after.version:${push.after.sha}}}\n" +
                "          --dockerfile=${parameters.dockerfile:Dockerfile}\n" +
                "          --cache=${parameters.cache:false}\n" +
                "          --cache-repo=${parameters.registry:docker.pkg.github.com}/${parameters.image}-cache\n" +
                "          --force &&\n" +
                "          echo '{ \"SdmGoal\": { \"push\": { \"after\": { \"images\" :[{ \"imageName\": \"${parameters.registry:docker.pkg.github.com}/${parameters.image}:${parameters.tag:${push.after.version:${push.after.sha}}}\" }] } } } }' > $ATOMIST_RESULT";
            // tslint:enable
            const result = await resolvePlaceholder(value, {
                sha: "sfsfsafdsf",
                branch: "master",
                repo: { owner: "foo", name: "bla" },
                push: { after: { sha: "sfsfsafdsf" }, repo: { owner: "atomist", name: "sdm" } },
            } as any, {
                configuration: {},
                context: {
                    graphClient: {
                        query: async () => {
                            return {};
                        },
                    },
                },
            } as any, { image: "test/test" });
            assert.deepStrictEqual(result, "          echo \"atm:phase=kaniko build\" &&\n" +
                "          /sdm/kaniko/executor\n" +
                "          --context=dir://$ATOMIST_PROJECT_DIR\n" +
                "          --destination=docker.pkg.github.com/test/test:sfsfsafdsf\n" +
                "          --dockerfile=Dockerfile\n" +
                "          --cache=false\n" +
                "          --cache-repo=docker.pkg.github.com/test/test-cache\n" +
                "          --force &&\n" +
                "          echo '{ \"SdmGoal\": { \"push\": { \"after\": { \"images\" :[{ \"imageName\": \"docker.pkg.github.com/test/test:sfsfsafdsf\" }] } } } }' > $ATOMIST_RESULT");
        });

        it("should delete optional placeholder", async () => {
            // tslint:disable-next-line:no-invalid-template-strings
            const value = "${!colors}";
            const result = await resolvePlaceholder(value, {} as any, {} as any, {});
            assert.deepStrictEqual(result, undefined);
        });

        it("should replace skill configuration parameters", async () => {
            // tslint:disable-next-line:no-invalid-template-strings
            const value = "${skill.configuration.parameters.image}/${skill.configuration.name}";
            const result = await resolvePlaceholder(value, {
                sha: "sfsfsafdsf",
                branch: "master",
                repo: { owner: "foo", name: "bla" },
                push: { after: { sha: "sfsfsafdsf" }, repo: { owner: "atomist", name: "sdm" } },
            } as any, {
                configuration: {},
                context: {
                    graphClient: {
                        query: async () => {
                            return {};
                        },
                    },
                    trigger: {
                        configuration: {
                            parameters: [{ name: "image", value: "foo:latest" }],
                        },
                    },
                },
                skill: {
                    configuration: {
                        name: "bar",
                        parameters: { image: "foo:latest" },
                    },
                },
            } as any, {});
            assert.deepStrictEqual(result, "foo:latest/bar");
        });

    });

});
