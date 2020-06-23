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
import {
    isKubernetesApplication,
    reqFilter,
    reqString,
} from "../../../../lib/pack/k8s/kubernetes/request";

describe("pack/k8s/kubernetes/request", () => {

    describe("isKubernetesApplication", () => {

        it("should return false if all missing", () => {
            const o = {};
            assert(!isKubernetesApplication(o));
        });

        it("should return false if passed undefined", () => {
            assert(!isKubernetesApplication(undefined));
        });

        it("should return false if some missing", () => {
            const o = {
                name: "elliott",
                ns: "smith",
                image: "pictures-of-me:3.46",
            };
            assert(!isKubernetesApplication(o));
        });

        it("should return true if all present", () => {
            const o = {
                name: "elliott",
                ns: "smith",
                image: "pictures-of-me:3.46",
                workspaceId: "KRS",
            };
            assert(isKubernetesApplication(o));
        });

    });

    describe("reqFilter", () => {

        it("should return the value", () => {
            const k = "Kat3Bu5h";
            const v = "Cloudbusting.5";
            const r = reqFilter(k, v);
            assert(r === v);
        });

        it("should not return config", () => {
            const k = "config";
            const v = "Cloudbusting.5";
            const r = reqFilter(k, v);
            assert(r === undefined);
        });

        it("should not return clients", () => {
            const k = "clients";
            const v = "Cloudbusting.5";
            const r = reqFilter(k, v);
            assert(r === undefined);
        });

        it("should not return secrets", () => {
            const k = "secrets";
            const v = "Cloudbusting.5";
            const r = reqFilter(k, v);
            assert(r === undefined);
        });

    });

    describe("reqString", () => {

        it("should stringify an object", () => {
            const r = {
                name: "cloudbusting",
                workspaceId: "KAT3BU5H",
            };
            const s = reqString(r);
            const e = `{"name":"cloudbusting","workspaceId":"KAT3BU5H"}`;
            assert(s === e);
        });

        it("should safely stringify a circular object", () => {
            const r: any = {
                name: "cloudbusting",
                workspaceId: "KAT3BU5H",
            };
            r.r = r;
            const s = reqString(r);
            const e = `{"name":"cloudbusting","workspaceId":"KAT3BU5H"}`;
            assert(s === e);
        });

        it("should stringify an object without secrets", () => {
            const r = {
                name: "cloudbusting",
                workspaceId: "KAT3BU5H",
                secrets: [
                    {
                        apiVersion: "v1",
                        kind: "Secret",
                        type: "Opaque",
                        metadata: {
                            name: "pixies",
                            labels: {
                                "app.kubernetes.io/managed-by": "Ken Goes",
                                "app.kubernetes.io/name": "pixies",
                                "app.kubernetes.io/part-of": "pixies",
                                "app.kubernetes.io/component": "secret",
                                "atomist.com/workspaceId": "P1X135",
                            },
                        },
                        data: {
                            piano: "S2F0ZSBCdXNo",
                            guitar: "QWxhbiBNdXJwaHk=",
                            bass: "RGVsIFBhbG1lciwgTWFydGluIEdsb3ZlciwgRWJlcmhhcmQgV2ViZXI=",
                            drums: "U3R1YXJ0IEVsbGlvdHQgJiBDaGFybGllIE1vcmdhbg==",
                            strings: "VGhlIE1lZGljaSBTZXh0ZXQ=",
                        },
                    },
                ],
            };
            const s = reqString(r);
            const e = `{"name":"cloudbusting","workspaceId":"KAT3BU5H"}`;
            assert(s === e);
        });

    });

});
