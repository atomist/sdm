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
    decryptSecret,
    encodeSecret,
    encryptSecret,
    secretTemplate,
} from "../../../../lib/pack/k8s/kubernetes/secret";

describe("pack/k8s/kubernetes/secret", () => {

    describe("secretTemplate", () => {

        it("should return a valid secret spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                sdmFulfiller: "EMI",
            };
            const p: k8s.V1Secret = {
                metadata: {
                    name: "musicians",
                },
                data: {
                    piano: "S2F0ZSBCdXNo",
                    guitar: "QWxhbiBNdXJwaHk=",
                    bass: "RGVsIFBhbG1lciwgTWFydGluIEdsb3ZlciwgRWJlcmhhcmQgV2ViZXI=",
                    drums: "U3R1YXJ0IEVsbGlvdHQgJiBDaGFybGllIE1vcmdhbg==",
                    strings: "VGhlIE1lZGljaSBTZXh0ZXQ=",
                },
            } as any;
            const s = await secretTemplate(r, p);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "app.kubernetes.io/component": "secret",
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                    name: p.metadata.name,
                    namespace: "hounds-of-love",
                },
                data: {
                    piano: "S2F0ZSBCdXNo",
                    guitar: "QWxhbiBNdXJwaHk=",
                    bass: "RGVsIFBhbG1lciwgTWFydGluIEdsb3ZlciwgRWJlcmhhcmQgV2ViZXI=",
                    drums: "U3R1YXJ0IEVsbGlvdHQgJiBDaGFybGllIE1vcmdhbg==",
                    strings: "VGhlIE1lZGljaSBTZXh0ZXQ=",
                },
            };
            assert.deepStrictEqual(s, e);
        });

        it("should fix incorrect API version and kind", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                sdmFulfiller: "EMI",
            };
            const p: k8s.V1Secret = {
                apiVersion: "apps/v1",
                kind: "Secrit",
                metadata: {
                    name: "musicians",
                },
                data: {
                    piano: "S2F0ZSBCdXNo",
                    guitar: "QWxhbiBNdXJwaHk=",
                    bass: "RGVsIFBhbG1lciwgTWFydGluIEdsb3ZlciwgRWJlcmhhcmQgV2ViZXI=",
                    drums: "U3R1YXJ0IEVsbGlvdHQgJiBDaGFybGllIE1vcmdhbg==",
                    strings: "VGhlIE1lZGljaSBTZXh0ZXQ=",
                },
            } as any;
            const s = await secretTemplate(r, p);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: p.metadata.name,
                    namespace: "hounds-of-love",
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "app.kubernetes.io/component": "secret",
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                },
                data: {
                    piano: "S2F0ZSBCdXNo",
                    guitar: "QWxhbiBNdXJwaHk=",
                    bass: "RGVsIFBhbG1lciwgTWFydGluIEdsb3ZlciwgRWJlcmhhcmQgV2ViZXI=",
                    drums: "U3R1YXJ0IEVsbGlvdHQgJiBDaGFybGllIE1vcmdhbg==",
                    strings: "VGhlIE1lZGljaSBTZXh0ZXQ=",
                },
            };
            assert.deepStrictEqual(s, e);
        });

        it("should not allow overriding namespace", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                sdmFulfiller: "EMI",
            };
            const p: k8s.V1Secret = {
                apiVersion: "apps/v1",
                kind: "Secrit",
                metadata: {
                    name: "musicians",
                    namespace: "the-kick-inside",
                },
                data: {
                    piano: "S2F0ZSBCdXNo",
                    guitar: "QWxhbiBNdXJwaHk=",
                    bass: "RGVsIFBhbG1lciwgTWFydGluIEdsb3ZlciwgRWJlcmhhcmQgV2ViZXI=",
                    drums: "U3R1YXJ0IEVsbGlvdHQgJiBDaGFybGllIE1vcmdhbg==",
                    strings: "VGhlIE1lZGljaSBTZXh0ZXQ=",
                },
            } as any;
            const s = await secretTemplate(r, p);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "musicians",
                    namespace: "hounds-of-love",
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "app.kubernetes.io/component": "secret",
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                },
                data: {
                    piano: "S2F0ZSBCdXNo",
                    guitar: "QWxhbiBNdXJwaHk=",
                    bass: "RGVsIFBhbG1lciwgTWFydGluIEdsb3ZlciwgRWJlcmhhcmQgV2ViZXI=",
                    drums: "U3R1YXJ0IEVsbGlvdHQgJiBDaGFybGllIE1vcmdhbg==",
                    strings: "VGhlIE1lZGljaSBTZXh0ZXQ=",
                },
            };
            assert.deepStrictEqual(s, e);
        });

        it("should return a custom secret spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                port: 5510,
                sdmFulfiller: "EMI",
            };
            const p: k8s.V1Secret = {
                metadata: {
                    annotations: {
                        "studio-album": "5",
                        "studios": `["Wickham Farm Home Studio", "Windmill Lane Studios", "Abbey Road Studios"]`,
                    },
                    labels: {
                        "app.kubernetes.io/component": "double-secret",
                        "app.kubernetes.io/version": "1.2.3",
                    },
                    name: "musicians",
                },
                data: {
                    piano: "S2F0ZSBCdXNo",
                    guitar: "QWxhbiBNdXJwaHk=",
                    bass: "RGVsIFBhbG1lciwgTWFydGluIEdsb3ZlciwgRWJlcmhhcmQgV2ViZXI=",
                    drums: "U3R1YXJ0IEVsbGlvdHQgJiBDaGFybGllIE1vcmdhbg==",
                    strings: "VGhlIE1lZGljaSBTZXh0ZXQ=",
                },
            } as any;
            const s = await secretTemplate(r, p);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    annotations: {
                        "studio-album": "5",
                        "studios": `["Wickham Farm Home Studio", "Windmill Lane Studios", "Abbey Road Studios"]`,
                    },
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "app.kubernetes.io/component": "double-secret",
                        "app.kubernetes.io/version": "1.2.3",
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                    name: p.metadata.name,
                    namespace: "hounds-of-love",
                },
                data: {
                    piano: "S2F0ZSBCdXNo",
                    guitar: "QWxhbiBNdXJwaHk=",
                    bass: "RGVsIFBhbG1lciwgTWFydGluIEdsb3ZlciwgRWJlcmhhcmQgV2ViZXI=",
                    drums: "U3R1YXJ0IEVsbGlvdHQgJiBDaGFybGllIE1vcmdhbg==",
                    strings: "VGhlIE1lZGljaSBTZXh0ZXQ=",
                },
            };
            assert.deepStrictEqual(s, e);
        });

    });

    describe("encodeSecret", () => {

        it("should encode a secret value", () => {
            const s = {
                "yo-la-tengo": `{"albums":["Ride the Tiger","New Wave Hot Dogs","President Yo La Tengo","Fakebook"]}`,
            };
            const k = encodeSecret("ylt", s);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "ylt",
                },
                data: {
                    "yo-la-tengo": "eyJhbGJ1bXMiOlsiUmlkZSB0aGUgVGlnZXIiLCJOZXcgV2F2ZSBIb3QgRG9ncyIsIlByZXNpZGVudCBZbyBMYSBUZW5nbyIsIkZha2Vib29rIl19",
                },
            };
            assert.deepStrictEqual(k, e);
        });

        it("should encode a few secret values", () => {
            const s = {
                "yo-la-tengo": `{"albums":["Ride the Tiger","New Wave Hot Dogs","President Yo La Tengo","Fakebook"]}`,
                "brokenSocialScene": "A Canadian musical collective.\n",
            };
            const k = encodeSecret("feel", s);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "feel",
                },
                data: {
                    "yo-la-tengo": "eyJhbGJ1bXMiOlsiUmlkZSB0aGUgVGlnZXIiLCJOZXcgV2F2ZSBIb3QgRG9ncyIsIlByZXNpZGVudCBZbyBMYSBUZW5nbyIsIkZha2Vib29rIl19",
                    "brokenSocialScene": "QSBDYW5hZGlhbiBtdXNpY2FsIGNvbGxlY3RpdmUuCg==",
                },
            };
            assert.deepStrictEqual(k, e);
        });

        it("should create an empty data secret", () => {
            const s = {};
            const k = encodeSecret("nada", s);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "nada",
                },
                data: {},
            };
            assert.deepStrictEqual(k, e);
        });

    });

    describe("encryptSecret", () => {

        it("should encrypt secret data values", async () => {
            const s = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "something",
                    namespace: "wicked",
                },
                data: {
                    nirvana: "TmV2ZXJtaW5k",
                    beck: "TWVsbG93IEdvbGQ=",
                    nin: "UHJldHR5IEhhdGUgTWFjaGluZQ==",
                },
            };
            const k = "Th1$W@yC0m3$";
            const v = await encryptSecret(s, k);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "something",
                    namespace: "wicked",
                },
                data: {
                    nirvana: "X4A0XdndoNRpP35GefUBeg==",
                    beck: "regxucYRQO/1tGXOqlZVi+C78DhYlA7l20vFwWLluFE=",
                    nin: "ap4QA+G47q6tr2JNrvxV2CW6rtHhMNzI8+a78BZ5cT0=",
                },
            };
            assert.deepStrictEqual(v, e);
        });

        it("should encrypt secret stringData values", async () => {
            const s = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "something",
                    namespace: "wicked",
                },
                data: {
                    nirvana: "TmV2ZXJtaW5k",
                    beck: "TWVsbG93IEdvbGQ=",
                    nin: "UHJldHR5IEhhdGUgTWFjaGluZQ==",
                },
                stringData: {
                    rodriguez: "sugar man",
                },
            };
            const k = "Th1$W@yC0m3$";
            const v = await encryptSecret(s, k);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "something",
                    namespace: "wicked",
                },
                data: {
                    nirvana: "X4A0XdndoNRpP35GefUBeg==",
                    beck: "regxucYRQO/1tGXOqlZVi+C78DhYlA7l20vFwWLluFE=",
                    nin: "ap4QA+G47q6tr2JNrvxV2CW6rtHhMNzI8+a78BZ5cT0=",
                    rodriguez: "rakPQtu/sN4j6JI8zm/75w==",
                },
            };
            assert.deepStrictEqual(v, e);
        });

        it("should encrypt secret stringData values over data values", async () => {
            const s = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "something",
                    namespace: "wicked",
                },
                data: {
                    nirvana: "TmV2ZXJtaW5k",
                    beck: "TWVsbG93IEdvbGQ=",
                    nin: "UHJldHR5IEhhdGUgTWFjaGluZQ==",
                },
                stringData: {
                    nin: "The Day the World Went Away",
                },
            };
            const k = "Th1$W@yC0m3$";
            const v = await encryptSecret(s, k);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "something",
                    namespace: "wicked",
                },
                data: {
                    nirvana: "X4A0XdndoNRpP35GefUBeg==",
                    beck: "regxucYRQO/1tGXOqlZVi+C78DhYlA7l20vFwWLluFE=",
                    nin: "AkJ5fZCiv3h5YqvA9vJyBh0UQBkNKcmoOvXE2m2LZd22TVzDiMbxungQgymAR/3x",
                },
            };
            assert.deepStrictEqual(v, e);
        });

    });

    describe("decryptSecret", () => {

        it("should decrypt secret data values", async () => {
            const s = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "something",
                    namespace: "wicked",
                },
                data: {
                    nirvana: "X4A0XdndoNRpP35GefUBeg==",
                    beck: "regxucYRQO/1tGXOqlZVi+C78DhYlA7l20vFwWLluFE=",
                    nin: "ap4QA+G47q6tr2JNrvxV2CW6rtHhMNzI8+a78BZ5cT0=",
                },
            };
            const k = "Th1$W@yC0m3$";
            const v = await decryptSecret(s, k);
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "something",
                    namespace: "wicked",
                },
                data: {
                    nirvana: "TmV2ZXJtaW5k",
                    beck: "TWVsbG93IEdvbGQ=",
                    nin: "UHJldHR5IEhhdGUgTWFjaGluZQ==",
                },
            };
            assert.deepStrictEqual(v, e);
        });

    });

});
