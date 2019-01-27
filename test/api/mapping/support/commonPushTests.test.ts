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

import { InMemoryProject } from "@atomist/automation-client";

import * as assert from "power-assert";
import { PushListenerInvocation } from "../../../../lib/api/listener/PushListener";
import {
    hasFile,
    hasFileContaining,
    hasFileWithExtension,
    IsPushToBranchWithPullRequest,
    ToDefaultBranch,
} from "../../../../lib/api/mapping/support/commonPushTests";

describe("commonPushTests", () => {

    describe("toDefaultBranch", () => {

        it("should pass for default branch", async () => {
            const pli = {
                project: InMemoryProject.of(),
                push: {
                    branch: "master",
                    repo: {
                        defaultBranch: "master",
                    },
                },
            };
            const r = await ToDefaultBranch.mapping(pli as any as PushListenerInvocation);
            assert(r);
        });

        it("should pass for empty default branch", async () => {
            const pli = {
                project: InMemoryProject.of(),
                push: {
                    branch: "master",
                    repo: {
                        defaultBranch: "",
                    },
                },
            };

            const r = await ToDefaultBranch.mapping(pli as any as PushListenerInvocation);
            assert(r);
        });

        it("should pass for null default branch", async () => {
            const pli = {
                project: InMemoryProject.of(),
                push: {
                    branch: "master",
                    repo: {
                        defaultBranch: undefined,
                    },
                },
            };

            const r = await ToDefaultBranch.mapping(pli as any as PushListenerInvocation);
            assert(r);
        });

        it("should not pass for non default branch", async () => {
            const pli = {
                project: InMemoryProject.of(),
                push: {
                    branch: "some-feature",
                    repo: {
                        defaultBranch: "master",
                    },
                },
            };

            const r = await ToDefaultBranch.mapping(pli as any as PushListenerInvocation);
            assert(!r);
        });

    });

    describe("hasFile", () => {

        it("should not find file in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await hasFile("whatever").mapping({ project } as any as PushListenerInvocation);
            assert(!r);
        });

        it("should find file", async () => {
            const project = InMemoryProject.of({ path: "pom.xml", content: "<xml>" });
            const r = await hasFile("pom.xml").mapping({ project } as any as PushListenerInvocation);
            assert(r);
        });
    });

    describe("hasFileContaining", () => {

        it("should not find in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await hasFileContaining("x", /y/).mapping({ project } as any as PushListenerInvocation);
            assert(!r);
        });

        it("should find containing", async () => {
            const project = InMemoryProject.of({ path: "src/main/java/Thing.java", content: "public class Thing {}" });
            const r = await hasFileContaining("src/main/java/Thing.java", /class/).mapping({ project } as any as PushListenerInvocation);
            assert(r);
        });

        it("should not find whe file does not contain", async () => {
            const project = InMemoryProject.of({ path: "src/main/java/Thing.kt", content: "public class Thing {}" });
            const r = await hasFileContaining("src/main/java/Thing.java", /xclass/).mapping({ project } as any as PushListenerInvocation);
            assert(!r);
        });
    });

    describe("hasFileWithExtension", () => {

        it("should return false if no files and empty extension", async () => {
            const project = InMemoryProject.of();
            const r = await hasFileWithExtension("").mapping({ project } as any as PushListenerInvocation);
            assert(!r);
        });

        it("should return true if any files and empty extension", async () => {
            const project = InMemoryProject.of({ path: "pom.xml", content: "<xml>" });
            const r = await hasFileWithExtension("").mapping({ project } as any as PushListenerInvocation);
            assert(r);
        });

        it("should return true if any files and undefined extension", async () => {
            const project = InMemoryProject.of({ path: "pom.xml", content: "<xml>" });
            const r = await hasFileWithExtension(undefined).mapping({ project } as any as PushListenerInvocation);
            assert(r);
        });

        it("should not find file in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await hasFileWithExtension("java").mapping({ project } as any as PushListenerInvocation);
            assert(!r);
        });

        it("should find one file", async () => {
            const project = InMemoryProject.of({ path: "pom.xml", content: "<xml>" });
            const r = await hasFileWithExtension("xml").mapping({ project } as any as PushListenerInvocation);
            assert(r);
            const r2 = await hasFileWithExtension("java").mapping({ project } as any as PushListenerInvocation);
            assert(!r2);
        });

        it("should strip . if provided", async () => {
            const project = InMemoryProject.of({ path: "pom.xml", content: "<xml>" });
            const r = await hasFileWithExtension(".xml").mapping({ project } as any as PushListenerInvocation);
            assert(r);
        });
    });

    describe("IsPushToBranchWithPullRequest", () => {

        it("should not pass for default branch", async () => {
            const pli = {
                project: InMemoryProject.of(),
                push: {
                    branch: "changes",
                    repo: {
                        defaultBranch: "changes",
                    },
                },
            };
            const r = await IsPushToBranchWithPullRequest.mapping(pli as any as PushListenerInvocation);
            assert(!r);
        });

        it("should pass for non-default branch with open pull request", async () => {
            const pli = {
                project: InMemoryProject.of(),
                push: {
                    branch: "oh-you-pretty-thing",
                    repo: {
                        name: "hunky-dory",
                        owner: "david-bowie",
                        defaultBranch: "changes",
                    },
                },
                context: {
                    graphClient: {
                        query: (q: any) => ({
                            Repo: [{
                                branches: [{
                                    pullRequests: [
                                        { state: "open" },
                                    ],
                                }],
                            }],
                        }),
                    },
                },
            };
            const r = await IsPushToBranchWithPullRequest.mapping(pli as any as PushListenerInvocation);
            assert(r);
        });

        it("should not pass for branch with no open pull requests", async () => {
            const pli = {
                project: InMemoryProject.of(),
                push: {
                    branch: "eight-line-poem",
                    repo: {
                        name: "hunky-dory",
                        owner: "david-bowie",
                        defaultBranch: "changes",
                    },
                },
                context: {
                    graphClient: {
                        query: (q: any) => ({
                            Repo: [{
                                branches: [{
                                    pullRequests: [
                                        { state: "closed" },
                                        { state: "closed" },
                                        { state: "closed" },
                                    ],
                                }],
                            }],
                        }),
                    },
                },
            };
            const r = await IsPushToBranchWithPullRequest.mapping(pli as any as PushListenerInvocation);
            assert(!r);
        });

        it("should pass for non-default branch with open and closed pull requests", async () => {
            const pli = {
                project: InMemoryProject.of(),
                push: {
                    branch: "life-on-mars",
                    repo: {
                        name: "hunky-dory",
                        owner: "david-bowie",
                        defaultBranch: "changes",
                    },
                },
                context: {
                    graphClient: {
                        query: (q: any) => ({
                            Repo: [{
                                branches: [{
                                    pullRequests: [
                                        { state: "closed" },
                                        { state: "closed" },
                                        { state: "open" },
                                        { state: "closed" },
                                    ],
                                }],
                            }],
                        }),
                    },
                },
            };
            const r = await IsPushToBranchWithPullRequest.mapping(pli as any as PushListenerInvocation);
            assert(r);
        });

    });

});
