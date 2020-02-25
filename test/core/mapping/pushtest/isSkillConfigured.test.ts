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

import { InMemoryFile } from "@atomist/automation-client/lib/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { fakePush } from "../../../../lib/api-helper/testsupport/fakePush";
import { isSkillConfigured } from "../../../../lib/core/mapping/pushtest/isSkillConfigured";

describe("isSkillConfigured", () => {

    it("should return true for no configuration", async () => {
        const result = await isSkillConfigured().mapping({} as any);
        assert.strictEqual(result, true);
    });

    it("should use hasFile from configuration", async () => {
        const p = InMemoryProject.of(new InMemoryFile("test.md", ""));
        const pli = fakePush(p);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    hasFile: "test.md",
                },
            },
        };
        let result = await isSkillConfigured().mapping(pli);
        assert.strictEqual(result, true);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    hasFile: "test.html",
                },
            },
        };
        result = await isSkillConfigured().mapping(pli);
        assert.strictEqual(result, false);
    });

    it("should use hasFile from configuration with name overwrite", async () => {
        const p = InMemoryProject.of(new InMemoryFile("test.md", ""));
        const pli = fakePush(p);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    file: "test.md",
                },
            },
        };
        let result = await isSkillConfigured({ hasFile: "file" }).mapping(pli);
        assert.strictEqual(result, true);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    file: "test.html",
                },
            },
        };
        result = await isSkillConfigured({ hasFile: "file" }).mapping(pli);
        assert.strictEqual(result, false);
    });

    it("should use isBranch from configuration", async () => {
        const p = InMemoryProject.of(new InMemoryFile("test.md", ""));
        const pli = fakePush(p);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    isBranch: "^mast.*$",
                },
            },
        };
        let result = await isSkillConfigured().mapping(pli);
        assert.strictEqual(result, true);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    isBranch: "^feature-*$",
                },
            },
        };
        result = await isSkillConfigured().mapping(pli);
        assert.strictEqual(result, false);
    });

    it("should use isBranch from configuration with name overwrite", async () => {
        const p = InMemoryProject.of(new InMemoryFile("test.md", ""));
        const pli = fakePush(p);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    branch: "^mast.*$",
                },
            },
        };
        let result = await isSkillConfigured({ isBranch: "branch" }).mapping(pli);
        assert.strictEqual(result, true);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    branch: "^feature-*$",
                },
            },
        };
        result = await isSkillConfigured({ isBranch: "branch" }).mapping(pli);
        assert.strictEqual(result, false);
    });

    it("should use isDefaultBranch from configuration", async () => {
        const p = InMemoryProject.of(new InMemoryFile("test.md", ""));
        const pli = fakePush(p);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    isDefaultBranch: true,
                },
            },
        };
        pli.push.repo = {
            defaultBranch: "master",
        } as any;
        let result = await isSkillConfigured().mapping(pli);
        assert.strictEqual(result, true);
        pli.push.branch = "feature-1";
        result = await isSkillConfigured().mapping(pli);
        assert.strictEqual(result, false);
    });

    it("should use isDefaultBranch from configuration with name overwrite", async () => {
        const p = InMemoryProject.of(new InMemoryFile("test.md", ""));
        const pli = fakePush(p);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    toDefaultBranch: true,
                },
            },
        };
        pli.push.repo = {
            defaultBranch: "master",
        } as any;
        let result = await isSkillConfigured({ isDefaultBranch: "toDefaultBranch" }).mapping(pli);
        assert.strictEqual(result, true);
        pli.push.branch = "feature-1";
        result = await isSkillConfigured({ isDefaultBranch: "toDefaultBranch" }).mapping(pli);
        assert.strictEqual(result, false);
    });

    it("should use hasCommit from configuration", async () => {
        const p = InMemoryProject.of(new InMemoryFile("test.md", ""));
        const pli = fakePush(p);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    hasCommit: "^Fix:.*$",
                },
            },
        };
        pli.push.commits = [{ message: "Something that doesn't match" }, { message: "Fix: handle null parameter" }];
        let result = await isSkillConfigured().mapping(pli);
        assert.strictEqual(result, true);
        pli.push.commits = [{ message: "Handle null parameter" }];
        result = await isSkillConfigured().mapping(pli);
        assert.strictEqual(result, false);
    });

    it("should use hasCommit from configuration with name overwrite", async () => {
        const p = InMemoryProject.of(new InMemoryFile("test.md", ""));
        const pli = fakePush(p);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    commits: "^Fix:.*$",
                },
            },
        };
        pli.push.commits = [{ message: "Something that doesn't match" }, { message: "Fix: handle null parameter" }];
        let result = await isSkillConfigured({ hasCommit: "commits" }).mapping(pli);
        assert.strictEqual(result, true);
        pli.push.commits = [{ message: "Handle null parameter" }];
        result = await isSkillConfigured({ hasCommit: "commits" }).mapping(pli);
        assert.strictEqual(result, false);
    });

    it("should combine the configured push tests", async () => {
        const p = InMemoryProject.of(new InMemoryFile("test.md", ""));
        const pli = fakePush(p);
        pli.skill = {
            configuration: {
                name: "default",
                parameters: {
                    file: "test.md",
                    hasCommit: "^Fix:.*$",
                    toDefaultBranch: true,
                    branch: "^mas.*$",
                },
            },
        };
        pli.push.commits = [{ message: "Something that doesn't match" }, { message: "Fix: handle null parameter" }];
        const result = await isSkillConfigured({ hasFile: "file", isBranch: "branch" }).mapping(pli);
        assert.strictEqual(result, true);
    });

});
