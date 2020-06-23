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

import * as k8s from "@kubernetes/client-node";
import * as assert from "power-assert";
import {
    applicationLabels,
    labelMatch,
    labelSelector,
    matchLabels,
    safeLabelValue,
} from "../../../../lib/pack/k8s/kubernetes/labels";

describe("pack/k8s/kubernetes/labels", () => {

    describe("safeLabelValue", () => {

        const validation = /^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$/;

        it("should not change a valid value", () => {
            const v = "Kat3Bu5h-Cloudbusting.5";
            const s = safeLabelValue(v);
            assert(validation.test(s));
            assert(s === v);
        });

        it("should not change an empty value", () => {
            const v = "";
            const s = safeLabelValue(v);
            assert(validation.test(s));
            assert(s === v);
        });

        it("should fix an invalid value", () => {
            const v = "@atomist/sdm-pack-k8s:1.1.0-k8s.20190125173349?";
            const s = safeLabelValue(v);
            const e = "atomist_sdm-pack-k8s_1.1.0-k8s.20190125173349";
            assert(validation.test(s));
            assert(s === e);
        });

        it("should fix consecutive invalid characters", () => {
            const v = "@atomist/sdm-pack-k8s:?*1.1.0-k8s.20190125173349?";
            const s = safeLabelValue(v);
            const e = "atomist_sdm-pack-k8s_1.1.0-k8s.20190125173349";
            assert(validation.test(s));
            assert(s === e);
        });

    });

    describe("matchLabels", () => {

        it("should return the proper match labels", () => {
            const r = {
                name: "cloudbusting",
                workspaceId: "KAT3BU5H",
            };
            const m = matchLabels(r);
            const e = {
                "app.kubernetes.io/name": "cloudbusting",
                "atomist.com/workspaceId": "KAT3BU5H",
            };
            assert.deepStrictEqual(m, e);
        });

    });

    describe("labelSelector", () => {

        it("should return the proper label selector string", () => {
            const r = {
                name: "cloudbusting",
                workspaceId: "KAT3BU5H",
            };
            const l = labelSelector(r);
            const e = "app.kubernetes.io/name=cloudbusting,atomist.com/workspaceId=KAT3BU5H";
            assert(l === e);
        });

    });

    describe("applicatonLabels", () => {

        it("should return the proper labels", () => {
            const r = {
                name: "cloudbusting",
                workspaceId: "KAT3BU5H",
                version: "5.1.0",
                sdmFulfiller: "EMI",
            };
            const l = applicationLabels(r);
            const e = {
                "app.kubernetes.io/name": "cloudbusting",
                "atomist.com/workspaceId": "KAT3BU5H",
                "app.kubernetes.io/version": "5.1.0",
                "app.kubernetes.io/part-of": "cloudbusting",
                "app.kubernetes.io/managed-by": "EMI",
            };
            assert.deepStrictEqual(l, e);
        });

        it("should return optional labels", () => {
            const r = {
                name: "cloudbusting",
                workspaceId: "KAT3BU5H",
                version: "5.1.0",
                sdmFulfiller: "EMI",
                component: "song",
                instance: "Fifth",
            };
            const l = applicationLabels(r);
            const e = {
                "app.kubernetes.io/name": "cloudbusting",
                "atomist.com/workspaceId": "KAT3BU5H",
                "app.kubernetes.io/version": "5.1.0",
                "app.kubernetes.io/part-of": "cloudbusting",
                "app.kubernetes.io/managed-by": "EMI",
                "app.kubernetes.io/component": "song",
                "app.kubernetes.io/instance": "Fifth",
            };
            assert.deepStrictEqual(l, e);
        });

        it("should return a superset of the match labels", () => {
            const r = {
                name: "cloudbusting",
                workspaceId: "KAT3BU5H",
                version: "5.1.0",
                sdmFulfiller: "EMI",
            };
            const l = applicationLabels(r);
            const m = matchLabels(r);
            Object.keys(m).forEach(k => {
                assert(Object.keys(l).includes(k));
                assert(l[k] === m[k]);
            });
        });

        it("should make the fulfiller a valid label value", () => {
            const r = {
                name: "cloudbusting",
                workspaceId: "KAT3BU5H",
                version: "5.1.0",
                sdmFulfiller: "@emi/Wickham-Farm::Welling,England_",
            };
            const l = applicationLabels(r);
            const e = {
                "app.kubernetes.io/name": "cloudbusting",
                "atomist.com/workspaceId": "KAT3BU5H",
                "app.kubernetes.io/version": "5.1.0",
                "app.kubernetes.io/part-of": "cloudbusting",
                "app.kubernetes.io/managed-by": "emi_Wickham-Farm_Welling_England",
            };
            assert.deepStrictEqual(l, e);
        });

    });

    describe("labelMatch", () => {

        const r = {
            apiVersion: "v1",
            kind: "Service",
            metadata: {
                labels: {
                    album: "Younger Than Yesterday",
                    year: "1967",
                    recordLabel: "Columbia",
                },
                name: "so-you-want-to-be-a-rock-n-roll-star",
                namespace: "byrds",
            },
        };

        it("should match when no label selectors", () => {
            assert(labelMatch(r));
            assert(labelMatch(r, undefined));
        });

        it("should not match when no labels", () => {
            const n = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "so-you-want-to-be-a-rock-n-roll-star",
                    namespace: "byrds",
                },
            };
            const s = {
                matchLabels: {
                    album: "Younger Than Yesterday",
                    year: "1967",
                    recordLabel: "Columbia",
                },
            };
            assert(!labelMatch(n, s));
        });

        it("should match empty string", () => {
            const n = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    labels: {
                        why: "",
                    },
                    name: "so-you-want-to-be-a-rock-n-roll-star",
                    namespace: "byrds",
                },
            };
            const s = {
                matchLabels: {
                    why: "",
                },
            };
            assert(labelMatch(n, s));
        });

        it("should match when matchLabels match", () => {
            const ss = [
                {
                    matchLabels: {
                        album: "Younger Than Yesterday",
                        year: "1967",
                        recordLabel: "Columbia",
                    },
                },
                {
                    matchLabels: {
                        album: "Younger Than Yesterday",
                        year: "1967",
                    },
                },
                {
                    matchLabels: {
                        recordLabel: "Columbia",
                    },
                },
                {
                    matchLabels: {},
                },
                {
                    matchLabels: undefined,
                },
            ];
            ss.forEach(s => {
                assert(labelMatch(r, s));
            });
        });

        it("should not match when matchLabels do not match", () => {
            const ss = [
                {
                    matchLabels: {
                        album: "Younger Than Yesterday",
                        year: "1968",
                        recordLabel: "Columbia",
                    },
                },
                {
                    matchLabels: {
                        album: "Older Than Yesterday",
                        year: "1968",
                    },
                },
                {
                    matchLabels: {
                        recordLabel: "RCA",
                    },
                },
                {
                    matchLabels: {
                        album: "Younger Than Yesterday",
                        year: "1967",
                        recordLabel: "Columbia",
                        release: "Deluxe Edition",
                    },
                },
            ];
            ss.forEach(s => {
                assert(!labelMatch(r, s));
            });
        });

        it("should match when matchExpressions match", () => {
            const ss = [
                {
                    matchExpressions: [
                        { key: "album", operator: "Exists" },
                        { key: "year", operator: "In", values: ["1966", "1967", "1970"] },
                        { key: "recordLabel", operator: "Exists" },
                    ],
                },
                {
                    matchExpressions: [
                        { key: "album", operator: "In", values: ["Younger Than Yesterday", "Sweetheart of the Rodeo"] },
                        { key: "year", operator: "Exists" },
                    ],
                },
                {
                    matchExpressions: [
                        { key: "recordLabel", operator: "NotIn", values: ["Geffen", "RCA"] },
                    ],
                },
                {
                    matchExpressions: [
                        { key: "recordLabel", operator: "NotIn", values: ["Geffen", "RCA"] },
                        { key: "manager", operator: "DoesNotExist" },
                    ],
                },
                {
                    matchExpressions: [],
                },
                {
                    matchExpressions: undefined,
                },
            ];
            ss.forEach(s => {
                assert(labelMatch(r, s));
            });
        });

        it("should not match when matchExpressions does not match", () => {
            const ss = [
                {
                    matchExpressions: [
                        { key: "album", operator: "Exists" },
                        { key: "year", operator: "In", values: ["1966", "1967", "1970"] },
                        { key: "recordLabel", operator: "DoesNotExist" },
                    ],
                },
                {
                    matchExpressions: [
                        { key: "album", operator: "In", values: ["Mr. Tambourine Man", "Sweetheart of the Rodeo"] },
                        { key: "year", operator: "Exists" },
                    ],
                },
                {
                    matchExpressions: [
                        { key: "recordLabel", operator: "In", values: ["Geffen", "RCA"] },
                    ],
                },
                {
                    matchExpressions: [
                        { key: "recordLabel", operator: "NotIn", values: ["Geffen", "RCA"] },
                        { key: "manager", operator: "Exists" },
                    ],
                },
            ];
            ss.forEach(s => {
                assert(!labelMatch(r, s));
            });
        });

        it("should match when matchLabels and matchExpressions match", () => {
            const ss: k8s.V1LabelSelector[] = [
                {
                    matchLabels: {
                        album: "Younger Than Yesterday",
                        year: "1967",
                        recordLabel: "Columbia",
                    },
                    matchExpressions: [
                        { key: "album", operator: "Exists" },
                        { key: "year", operator: "In", values: ["1966", "1967", "1970"] },
                        { key: "recordLabel", operator: "Exists" },
                    ],
                },
                {
                    matchLabels: {
                        album: "Younger Than Yesterday",
                        year: "1967",
                    },
                    matchExpressions: [
                        { key: "album", operator: "In", values: ["Younger Than Yesterday", "Sweetheart of the Rodeo"] },
                        { key: "year", operator: "Exists" },
                    ],
                },
                {
                    matchLabels: {
                        recordLabel: "Columbia",
                    },
                    matchExpressions: [
                        { key: "manager", operator: "DoesNotExist" },
                    ],
                },
                {
                    matchLabels: {},
                    matchExpressions: [],
                },
                {
                    matchLabels: undefined,
                    matchExpressions: undefined,
                },
            ];
            ss.forEach(s => {
                assert(labelMatch(r, s));
            });
        });

        it("should not match when matchLabels and/or matchExpressions do not match", () => {
            const ss: k8s.V1LabelSelector[] = [
                {
                    matchLabels: {
                        album: "Younger Than Yesterday",
                        year: "1967",
                        recordLabel: "Columbia",
                    },
                    matchExpressions: [
                        { key: "album", operator: "Exists" },
                        { key: "year", operator: "In", values: ["1966", "1967", "1970"] },
                        { key: "recordLabel", operator: "DoesNotExist" },
                    ],
                },
                {
                    matchLabels: {
                        album: "Younger Than Yesterday",
                        year: "1968",
                    },
                    matchExpressions: [
                        { key: "album", operator: "In", values: ["Younger Than Yesterday", "Sweetheart of the Rodeo"] },
                        { key: "year", operator: "Exists" },
                    ],
                },
                {
                    matchLabels: {
                        recordLabel: "RCA",
                    },
                    matchExpressions: [
                        { key: "manager", operator: "In", values: ["Roger McGuinn", "Chris Hillman"] },
                    ],
                },
            ];
            ss.forEach(s => {
                assert(!labelMatch(r, s));
            });
        });

        it("should throw an error when match expression operator invalid", () => {
            assert.throws(() => labelMatch(r, { matchExpressions: [{ key: "manager", operator: "==" }] }),
                /Unsupported match expression operator: /);
        });

    });

});
