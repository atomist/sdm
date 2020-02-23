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

import { RepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { File } from "@atomist/automation-client/lib/project/File";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import * as assert from "power-assert";
import { LoggingProgressLog } from "../../../../lib/api-helper/log/LoggingProgressLog";
import { fakeGoalInvocation } from "../../../../lib/api-helper/testsupport/fakeGoalInvocation";
import { fakePush } from "../../../../lib/api-helper/testsupport/fakePush";
import {
    GoalInvocation,
    GoalProjectListenerEvent,
    GoalProjectListenerRegistration,
} from "../../../../lib/api/goal/GoalInvocation";
import { pushTest } from "../../../../lib/api/mapping/PushTest";
import { AnyPush } from "../../../../lib/api/mapping/support/commonPushTests";
import {
    cachePut,
    cacheRemove,
    cacheRestore,
    GoalCache,
    GoalCacheOptions,
    resolveClassifierPath,
    sanitizeClassifier,
} from "../../../../lib/core/goal/cache/goalCaching";

class TestGoalArtifactCache implements GoalCache {
    private id: RepoRef;
    private cacheFiles: File[];
    private classifier: string;

    public async put(gi: GoalInvocation, project: Project, files: string[], classifier: string = "default"): Promise<string> {
        this.id = gi.id;
        this.cacheFiles = await Promise.all(files.map(async f => project.getFile(f)));
        this.classifier = classifier;
        return undefined;
    }

    public async empty(): Promise<void> {
        this.id = undefined;
        this.cacheFiles = undefined;
        this.classifier = undefined;
    }

    public async remove(gi: GoalInvocation): Promise<void> {
        if (this.id === gi.id) {
            this.id = undefined;
            this.cacheFiles = undefined;
            this.classifier = undefined;
        } else {
            throw Error("Wrong id!");
        }
    }

    public async retrieve(gi: GoalInvocation, project: Project, classifier: string = "default"): Promise<void> {
        if (this.id === gi.id && this.classifier === classifier) {
            if (this.cacheFiles === undefined) {
                throw Error("No cache");
            }
            this.cacheFiles.forEach(f => project.add(f));
        } else {
            throw Error("Wrong id!");
        }
    }
}

const ErrorProjectListenerRegistration: GoalProjectListenerRegistration = {
    name: "Error",
    listener: async () => {
        throw Error("Test cache miss");
    },
    pushTest: AnyPush,
};

describe("goalCaching", () => {

    describe("sanitizeClassifier", () => {

        it("should do nothing successfully", () => {
            ["", "simple", "foo.bar", "foo..bar"].forEach(c => {
                const s = sanitizeClassifier(c);
                assert(s === c);
            });
        });

        it("should unhide paths", () => {
            [
                { c: ".foo", e: "foo" },
                { c: "..foo", e: "foo" },
                { c: "._foo", e: "_foo" },
                { c: "./.", e: "_." },
                { c: "././.", e: "_._." },
                { c: "./.././", e: "_.._._" },
                { c: "..", e: "" },
                { c: "../../..", e: "_.._.." },
                { c: "../../../", e: "_.._.._" },
                { c: "../../../foo", e: "_.._.._foo" },
            ].forEach(ce => {
                const s = sanitizeClassifier(ce.c);
                assert(s === ce.e);
                const b = ce.c.replace(/\//g, "\\");
                const t = sanitizeClassifier(b);
                assert(t === ce.e);
            });
        });

        it("should replace invalid characters", () => {
            [
                { c: "/", e: "_" },
                { c: "///", e: "___" },
                { c: "/foo", e: "_foo" },
                { c: "///foo", e: "___foo" },
                { c: "//foo//", e: "__foo__" },
                { c: "/../../../foo", e: "_.._.._.._foo" },
                { c: "_foo", e: "_foo" },
                { c: "__foo", e: "__foo" },
                { c: "foo.", e: "foo." },
                { c: "foo..", e: "foo.." },
                { c: "foo/", e: "foo_" },
                { c: "foo////", e: "foo____" },
                { c: "foo/..", e: "foo_.." },
                { c: "foo/.././..", e: "foo_.._._.." },
                { c: "foo/././././", e: "foo_._._._._" },
                { c: "foo/../../../..", e: "foo_.._.._.._.." },
                { c: "foo/../../../../", e: "foo_.._.._.._.._" },
                { c: "foo/./bar", e: "foo_._bar" },
                { c: "foo/././bar", e: "foo_._._bar" },
                { c: "foo/././././bar", e: "foo_._._._._bar" },
                { c: "foo/../bar", e: "foo_.._bar" },
                { c: "foo/../../bar", e: "foo_.._.._bar" },
                { c: "foo/../../../../bar", e: "foo_.._.._.._.._bar" },
                { c: "foo/./.././../bar", e: "foo_._.._._.._bar" },
                { c: "foo/.././.././bar", e: "foo_.._._.._._bar" },
                { c: "foo/..///.//../bar", e: "foo_..___.__.._bar" },
                { c: "foo/.././/.././bar/../././//..//./baz", e: "foo_.._.__.._._bar_.._._.___..__._baz" },
                { c: "foo/.../bar", e: "foo_..._bar" },
                { c: "foo/..../bar", e: "foo_...._bar" },
                { c: "foo/.bar", e: "foo_.bar" },
                { c: "foo/..bar", e: "foo_..bar" },
                { c: "foo/...bar", e: "foo_...bar" },
                { c: "foo/.bar/.baz", e: "foo_.bar_.baz" },
                { c: "foo/..bar/..baz", e: "foo_..bar_..baz" },
                { c: "foo/.../bar/.../baz", e: "foo_..._bar_..._baz" },
                { c: "foo/....bar.baz", e: "foo_....bar.baz" },
                { c: "foo/.../.bar.baz", e: "foo_..._.bar.baz" },
                { c: "foo/....bar.baz/.qux.", e: "foo_....bar.baz_.qux." },
            ].forEach(ce => {
                const s = sanitizeClassifier(ce.c);
                assert(s === ce.e);
                const b = ce.c.replace(/\//g, "\\");
                const t = sanitizeClassifier(b);
                assert(t === ce.e);
            });
        });

        it("should handle the diabolical", () => {
            const c = "../.././...////....foo//.bar.baz/./..//...///...qux./quux...quuz/./../corge//...///./.";
            const s = sanitizeClassifier(c);
            const e = "_.._._...____....foo__.bar.baz_._..__...___...qux._quux...quuz_._.._corge__...___._.";
            assert(s === e);
        });

    });

    describe("resolveClassifierPath", () => {

        const gi: any = {
            configuration: {
                sdm: {
                    docker: {
                        registry: "kinks/bigsky",
                    },
                },
            },
            context: {
                workspaceId: "TH3K1NK5",
            },
            goalEvent: {
                branch: "preservation/society",
                repo: {
                    name: "village-green",
                    owner: "TheKinks",
                    providerId: "PyeReprise",
                },
                sha: "9932791f7adfd854b576125b058e9eb45b3da8b9",
            },
        };

        it("should return the workspace ID", async () => {
            for (const c of [undefined, ""]) {
                const r = await resolveClassifierPath(c, gi);
                assert(r === "TH3K1NK5");
            }
        });

        it("should prepend the workspace ID", async () => {
            for (const c of ["simple", "foo.bar", "foo..bar"]) {
                const r = await resolveClassifierPath(c, gi);
                assert(r === `TH3K1NK5/${c}`);
            }
        });

        it("should replace placeholders", async () => {
            // tslint:disable-next-line:no-invalid-template-strings
            const c = "star-struck_${repo.providerId}_${repo.owner}_${repo.name}_${sha}_PhenomenalCat";
            const r = await resolveClassifierPath(c, gi);
            const e = "TH3K1NK5/star-struck_PyeReprise_TheKinks_village-green_9932791f7adfd854b576125b058e9eb45b3da8b9_PhenomenalCat";
            assert(r === e);
        });

        it("should replace placeholders and provide defaults", async () => {
            // tslint:disable-next-line:no-invalid-template-strings
            const c = "star-struck_${repo.providerId}_${repo.owner}_${repo.name}_${brunch:hunch}_PhenomenalCat";
            const r = await resolveClassifierPath(c, gi);
            const e = "TH3K1NK5/star-struck_PyeReprise_TheKinks_village-green_hunch_PhenomenalCat";
            assert(r === e);
        });

        it("should replace nested placeholders", async () => {
            // tslint:disable-next-line:no-invalid-template-strings
            const c = "star-struck_${repo.providerId}_${repo.owner}_${repo.name}_${brunch:${sha}}_PhenomenalCat";
            const r = await resolveClassifierPath(c, gi);
            const e = "TH3K1NK5/star-struck_PyeReprise_TheKinks_village-green_9932791f7adfd854b576125b058e9eb45b3da8b9_PhenomenalCat";
            assert(r === e);
        });

        it("should replace and sanitize placeholders", async () => {
            // tslint:disable-next-line:no-invalid-template-strings
            const c = "star-struck_${sdm.docker.registry}_${repo.owner}_${repo.name}_${branch}_PhenomenalCat";
            const r = await resolveClassifierPath(c, gi);
            const e = "TH3K1NK5/star-struck_kinks_bigsky_TheKinks_village-green_preservation_society_PhenomenalCat";
            assert(r === e);
        });

    });

    describe("goalCaching", () => {
        let project;
        const testCache = new TestGoalArtifactCache();
        let fakePushId;
        let fakeGoal;

        beforeEach(() => {
            project = InMemoryProject.of({ path: "test.txt", content: "Test" }, {
                path: "dirtest/test.txt",
                content: "",
            });
            fakePushId = fakePush().id;
            fakeGoal = fakeGoalInvocation(fakePushId);
            fakeGoal.progressLog = new LoggingProgressLog("test", "debug");
            fakeGoal.configuration.sdm.cache = {
                enabled: true,
                store: testCache,
            };
        });

        it("should cache and retrieve", async () => {
            const options: GoalCacheOptions = {
                entries: [{ classifier: "default", pattern: { globPattern: "**/*.txt" } }],
                onCacheMiss: ErrorProjectListenerRegistration,
            };

            fakeGoal.goalEvent.data = JSON.stringify({ foo: "bar" });

            await cachePut(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            // it should find it in the cache
            const emptyProject = InMemoryProject.of();
            assert(!await emptyProject.hasFile("test.txt"));
            await cacheRestore(options)
                .listener(emptyProject as any as GitProject, fakeGoal, GoalProjectListenerEvent.before);
            assert(await emptyProject.hasFile("test.txt"));
            const data = JSON.parse(fakeGoal.goalEvent.data);
            assert.deepStrictEqual(data["@atomist/sdm/input"], [{ classifier: "default" }]);
            assert.deepStrictEqual(data["@atomist/sdm/output"], options.entries);
            assert.deepStrictEqual(data.foo, "bar");
        });

        it("should call fallback on cache miss", async () => {
            // when cache something
            const fallback: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    await p.addFile("test2.txt", "test");
                },
            };
            const options: GoalCacheOptions = {
                entries: [{ classifier: "default", pattern: { globPattern: "**/*.txt" } }],
                onCacheMiss: fallback,
            };
            await cachePut(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            // and clearing the cache
            await cacheRemove(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            // it should not find it in the cache and call fallback
            const emptyProject = InMemoryProject.of();
            assert(!await emptyProject.hasFile("test2.txt"));
            await cacheRestore(options)
                .listener(emptyProject as any as GitProject, fakeGoal, GoalProjectListenerEvent.before);
            assert(await emptyProject.hasFile("test2.txt"));
        });

        it("should call multiple fallbacks on cache miss", async () => {
            // when cache something
            const fallback: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    await p.addFile("test2.txt", "test");
                },
            };
            const fallback2: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    if (await p.hasFile("test2.txt")) {
                        await p.addFile("test3.txt", "test");
                    }
                },
            };
            const options: GoalCacheOptions = {
                entries: [{ classifier: "default", pattern: { globPattern: "**/*.txt" } }],
                onCacheMiss: [fallback, fallback2],
            };
            await cachePut(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            // and clearing the cache
            await cacheRemove(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            // it should not find it in the cache and call fallback
            const emptyProject = InMemoryProject.of();
            await cacheRestore(options)
                .listener(emptyProject as any as GitProject, fakeGoal, GoalProjectListenerEvent.before);
            assert(await emptyProject.hasFile("test2.txt"));
            assert(await emptyProject.hasFile("test3.txt"));
        });

        it("shouldn't call fallback with failing pushtest on cache miss", async () => {
            // when cache something
            const NoPushMatches = pushTest("never", async () => false);
            const fallback: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    await p.addFile("test.txt", "test");
                },
            };
            const fallback2: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    await p.addFile("test2.txt", "test");
                },
                pushTest: NoPushMatches,
            };
            const fallback3: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    await p.addFile("test3.txt", "test");
                },
            };
            const options: GoalCacheOptions = {
                entries: [{ classifier: "default", pattern: { globPattern: "**/*.txt" } }],
                onCacheMiss: [fallback, fallback2, fallback3],
            };
            await cachePut(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            // and clearing the cache
            await cacheRemove(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            // it should not find it in the cache and call fallback
            const emptyProject = InMemoryProject.of();
            await cacheRestore(options)
                .listener(emptyProject as any as GitProject, fakeGoal, GoalProjectListenerEvent.before);
            assert(await emptyProject.hasFile("test.txt"));
            assert(!await emptyProject.hasFile("test2.txt"));
            assert(await emptyProject.hasFile("test3.txt"));
        });

        it("shouldn't call fallback with wrong event on cache miss", async () => {
            // when cache something
            const NoPushMatches = pushTest("never", async () => false);
            const fallback: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    await p.addFile("test.txt", "test");
                },
            };
            const fallback2: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    await p.addFile("test2.txt", "test");
                },
                pushTest: NoPushMatches,
            };
            const fallback3: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    await p.addFile("test3.txt", "test");
                },
                events: [GoalProjectListenerEvent.after],
            };
            const options: GoalCacheOptions = {
                entries: [{ classifier: "default", pattern: { globPattern: "**/*.txt" } }],
                onCacheMiss: [fallback, fallback2, fallback3],
            };
            await cachePut(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            // and clearing the cache
            await cacheRemove(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            // it should not find it in the cache and call fallback
            const emptyProject = InMemoryProject.of();
            await cacheRestore(options)
                .listener(emptyProject as any as GitProject, fakeGoal, GoalProjectListenerEvent.before);
            assert(await emptyProject.hasFile("test.txt"));
            assert(!await emptyProject.hasFile("test2.txt"));
            assert(!await emptyProject.hasFile("test3.txt"));
        });

        it("should default to NoOpGoalCache", async () => {
            fakeGoal.configuration.sdm.cache.store = undefined;
            const fallback: GoalProjectListenerRegistration = {
                name: "fallback",
                listener: async p => {
                    await p.addFile("fallback.txt", "test");
                },
            };
            const options: GoalCacheOptions = {
                entries: [{ classifier: "default", pattern: { globPattern: "**/*.txt" } }],
                onCacheMiss: fallback,
            };
            await cachePut(options)
                .listener(project, fakeGoal, GoalProjectListenerEvent.after);
            const emptyProject = InMemoryProject.of();
            await cacheRestore(options)
                .listener(emptyProject as any as GitProject, fakeGoal, GoalProjectListenerEvent.before);
            assert(await emptyProject.hasFile("fallback.txt"));
        });

    });

});
