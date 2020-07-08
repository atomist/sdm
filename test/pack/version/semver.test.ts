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
import { formatDate } from "../../../lib/api-helper/misc/dateFormat";
import {
    addBranchPreRelease,
    cleanSemVerPrereleaseIdentifier,
    goalMilestoneOrRcVersion,
    isMilestoneOrReleaseCandidate,
    releaseLikeVersion,
    releaseVersion,
} from "../../../lib/pack/version/semver";

describe("semver", () => {
    describe("addBranchPreRelease", () => {
        it("adds timestamp without branch", () => {
            const b = "1.2.3";
            const g: any = {
                branch: "master",
                push: {
                    repo: {
                        defaultBranch: "master",
                    },
                },
            };
            const d = formatDate().slice(0, -2);
            const p = addBranchPreRelease(b, g);
            assert(RegExp(`^1\\.2\\.3-${d}[0-9]{2}$`).test(p));
        });

        it("adds timestamp with branch", () => {
            const b = "1.2.3";
            const g: any = {
                branch: "not-master",
                push: {
                    repo: {
                        defaultBranch: "master",
                    },
                },
            };
            const db = formatDate();
            const p = addBranchPreRelease(b, g);
            const da = formatDate();
            if (db === da) {
                assert(p === `1.2.3-branch-not-master.${da}`);
            } else {
                assert(p === `1.2.3-branch-not-master.${db}` || p === `1.2.3-branch-not-master.${da}`);
            }
        });

        it("adds timestamp with sanitized branch", () => {
            const b = "1.2.3";
            const g: any = {
                branch: "$some_crazy/*/branch.name-",
                push: {
                    repo: {
                        defaultBranch: "master",
                    },
                },
            };
            const db = formatDate();
            const p = addBranchPreRelease(b, g);
            const da = formatDate();
            if (db === da) {
                assert(p === `1.2.3-branch-some-crazy-branch-name-.${da}`);
            } else {
                assert(
                    p === `1.2.3-branch-some-crazy-branch-name-.${db}` ||
                        p === `1.2.3-branch-some-crazy-branch-name-.${da}`,
                );
            }
        });
    });

    describe("cleanSemVerPrereleaseIdentifier", () => {
        it("returns a valid prerelease identifier unchanged", () => {
            ["branch-m83", "hurry-up-WeRe-DREAMING", "ClaudiaLewis", "100000"].forEach(v => {
                const c = cleanSemVerPrereleaseIdentifier(v);
                assert(c === v);
            });
        });

        it("returns a clean prerelease identifer", () => {
            [
                { v: "things.are_not_@$-THEY~S33M", e: "things-are-not-THEYS33M" },
                { v: "0", e: "ZERO" },
                { v: "0000", e: "ZERO" },
                { v: "0123", e: "123" },
                { v: "0$&^0!0321", e: "321" },
                { v: "0$&^0!000", e: "ZERO" },
                { v: "_!@#$%^&*~", e: "-" },
                { v: "branch-Raconte-Moi Une Historie-", e: "branch-Raconte-MoiUneHistorie-" },
            ].forEach(ve => {
                const c = cleanSemVerPrereleaseIdentifier(ve.v);
                assert(c === ve.e);
            });
        });
    });

    describe("releaseVersion", () => {
        it("passes a release version through unchanged", () => {
            ["0.0.0", "0.1.0", "1.0.0", "1.2.3", "3.2.1", "12345.67890.1234567890"].forEach(v => {
                const r = releaseVersion(v);
                assert(r === v);
            });
        });

        it("removes prerelease portion from version", () => {
            [
                { p: "0.0.0-the-mountain-goats", e: "0.0.0" },
                { p: "0.1.0-branch-test.20191015151019+circleci.754", e: "0.1.0" },
                { p: "1.0.0-IWontGetBetter", e: "1.0.0" },
                { p: "1.2.3-branch-isaiah.45.23", e: "1.2.3" },
                { p: "3.2.1-20191015141019+sdm.29", e: "3.2.1" },
                { p: "12345.67890.1234567890-the.life.of.the.world.to.come.2.10", e: "12345.67890.1234567890" },
            ].forEach(pe => {
                const r = releaseVersion(pe.p);
                assert(r === pe.e);
            });
        });

        it("removes build metadata from version", () => {
            [
                { p: "0.0.0+the-mountain-goats", e: "0.0.0" },
                { p: "0.1.0+branch-test.20191015151019+circleci.754", e: "0.1.0" },
                { p: "1.0.0+IWontGetBetter", e: "1.0.0" },
                { p: "1.2.3+branch-isaiah.45.23", e: "1.2.3" },
                { p: "3.2.1+20191015141019+sdm.29", e: "3.2.1" },
                { p: "12345.67890.1234567890+the.life.of.the.world.to.come.2.10", e: "12345.67890.1234567890" },
            ].forEach(pe => {
                const r = releaseVersion(pe.p);
                assert(r === pe.e);
            });
        });
    });

    describe("isMilestoneOrReleaseCandidate", () => {
        it("returns false for release versions", () => {
            ["0.0.0", "0.1.0", "1.0.0", "1.2.3", "3.2.1", "12345.67890.1234567890"].forEach(v => {
                assert(!isMilestoneOrReleaseCandidate(v));
            });
        });

        it("returns true for milesone release versions", () => {
            ["0.0.0-M.1", "0.1.0-M.42", "1.0.0-M.7", "1.2.3-M.5", "3.2.1-M.9", "12345.67890.1234567890-M.11"].forEach(
                v => {
                    assert(isMilestoneOrReleaseCandidate(v));
                },
            );
        });

        it("returns true for release candidate versions", () => {
            ["0.1.0-RC.42", "1.0.0-RC.7", "1.2.3-RC.5", "3.2.1-RC.9", "12345.67890.1234567890-RC.11"].forEach(v => {
                assert(isMilestoneOrReleaseCandidate(v));
            });
        });
    });

    describe("goalMilestoneOrRcVersion", () => {
        it("finds the milestone release version", () => {
            const g: any = {
                goalEvent: {
                    push: {
                        after: {
                            tags: [
                                { name: "1.0.0-branch-master.20191010101010" },
                                { name: "1.0.0-branch-master.20191010101010+sdm.443" },
                                { name: "1.0.0-M.3" },
                                { name: "1.0.0-20191010101010" },
                            ],
                        },
                    },
                },
            };
            const v = goalMilestoneOrRcVersion(g);
            assert(v === "1.0.0-M.3");
        });

        it("finds the release candidate version", () => {
            const g: any = {
                goalEvent: {
                    push: {
                        after: {
                            tags: [
                                { name: "1.0.0-branch-master.20191010101010" },
                                { name: "1.0.0-branch-master.20191010101010+sdm.443" },
                                { name: "1.0.0-20191010101010" },
                                { name: "1.0.0-RC.42" },
                            ],
                        },
                    },
                },
            };
            const v = goalMilestoneOrRcVersion(g);
            assert(v === "1.0.0-RC.42");
        });

        it("finds nothing", () => {
            [
                undefined,
                [],
                [
                    { name: "1.0.0-branch-master.20191010101010" },
                    { name: "1.0.0-branch-master.20191010101010+sdm.443" },
                    { name: "1.0.0-20191010101010" },
                ],
            ].forEach(ts => {
                const g: any = {
                    goalEvent: {
                        push: {
                            after: {
                                tags: ts,
                            },
                        },
                    },
                };
                const v = goalMilestoneOrRcVersion(g);
                assert(v === undefined);
            });
        });
    });

    describe("releaseMilestonOrReleaseCandidate", () => {
        it("finds the milestone release version", () => {
            const g: any = {
                goalEvent: {
                    push: {
                        after: {
                            tags: [
                                { name: "1.0.0-branch-master.20191010101010" },
                                { name: "1.0.0-branch-master.20191010101010+sdm.443" },
                                { name: "1.0.0-M.3" },
                                { name: "1.0.0-20191010101010" },
                            ],
                        },
                    },
                },
            };
            const v = releaseLikeVersion("3.2.1-20160103", g);
            assert(v === "1.0.0-M.3");
        });

        it("finds the release candidate version", () => {
            const g: any = {
                goalEvent: {
                    push: {
                        after: {
                            tags: [
                                { name: "1.0.0-branch-master.20191010101010" },
                                { name: "1.0.0-branch-master.20191010101010+sdm.443" },
                                { name: "1.0.0-20191010101010" },
                                { name: "1.0.0-RC.42" },
                            ],
                        },
                    },
                },
            };
            const v = releaseLikeVersion("1.2.3-2010", g);
            assert(v === "1.0.0-RC.42");
        });

        it("returns the release version", () => {
            [
                undefined,
                [],
                [
                    { name: "1.0.0-branch-master.20191010101010" },
                    { name: "1.0.0-branch-master.20191010101010+sdm.443" },
                    { name: "1.0.0-20191010101010" },
                ],
            ].forEach(ts => {
                const g: any = {
                    goalEvent: {
                        push: {
                            after: {
                                tags: ts,
                            },
                        },
                    },
                };
                const v = releaseLikeVersion("1.2.3-2001", g);
                assert(v === "1.2.3");
            });
        });
    });
});
