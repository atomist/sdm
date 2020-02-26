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
    k8sErrMsg,
    maskString,
    requestErrMsg,
    requestError,
} from "../../../../../lib/core/pack/k8s/support/error";

describe("core/pack/k8s/support/error", () => {

    describe("k8sErrMsg", () => {

        it("should handle undefined", () => {
            const m = k8sErrMsg(undefined);
            assert(m === undefined);
        });

        it("should handle null", () => {
            // tslint:disable-next-line:no-null-keyword
            const m = k8sErrMsg(null);
            assert(m === "null");
        });

        it("should handle an Error", () => {
            const r = new Error("Blitzen Trapper");
            const m = k8sErrMsg(r);
            const e = "Blitzen Trapper";
            assert(m === e);
        });

        it("should handle a Kubernetes API error", () => {
            /* tslint:disable:max-line-length no-null-keyword */
            const r: any = {
                response: {
                    statusCode: 422,
                    body: {
                        kind: "Status",
                        apiVersion: "v1",
                        metadata: {},
                        status: "Failure",
                        message: "RESPONSE!!!Namespace \"local\" is invalid: metadata.labels: Invalid value: \"@atomist/sdm-pack-k8s:1.1.0-k8s.20190125173349\": a valid label must be an empty string or consist of alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character (e.g. 'MyValue',  or 'my_value',  or '12345', regex used for validation is '(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?')",
                        reason: "Invalid",
                        details: {
                            name: "local",
                            kind: "Namespace",
                            causes: [
                                {
                                    reason: "FieldValueInvalid",
                                    message: "Invalid value: \"@atomist/sdm-pack-k8s:1.1.0-k8s.20190125173349\": a valid label must be an empty string or consist of alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character (e.g. 'MyValue',  or 'my_value',  or '12345', regex used for validation is '(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?')",
                                    field: "metadata.labels",
                                },
                            ],
                        },
                        code: 422,
                    },
                    headers: {
                        "content-type": "application/json",
                        "date": "Fri, 25 Jan 2019 17:47:55 GMT",
                        "content-length": "960",
                        "connection": "close",
                    },
                    request: {
                        uri: {
                            protocol: "https:",
                            slashes: true,
                            auth: null,
                            host: "192.168.99.100:8443",
                            port: "8443",
                            hostname: "192.168.99.100",
                            hash: null,
                            search: null,
                            query: null,
                            pathname: "/api/v1/namespaces",
                            path: "/api/v1/namespaces",
                            href: "https://192.168.99.100:8443/api/v1/namespaces",
                        },
                        method: "POST",
                        headers: {
                            "authorization": "",
                            "accept": "application/json",
                            "content-type": "application/json",
                            "content-length": 225,
                        },
                    },
                },
                body: {
                    kind: "Status",
                    apiVersion: "v1",
                    metadata: {},
                    status: "Failure",
                    message: "Namespace \"local\" is invalid: metadata.labels: Invalid value: \"@atomist/sdm-pack-k8s:1.1.0-k8s.20190125173349\": a valid label must be an empty string or consist of alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character (e.g. 'MyValue',  or 'my_value',  or '12345', regex used for validation is '(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?')",
                    reason: "Invalid",
                    details: {
                        name: "local",
                        kind: "Namespace",
                        causes: [
                            {
                                reason: "FieldValueInvalid",
                                message: "Invalid value: \"@atomist/sdm-pack-k8s:1.1.0-k8s.20190125173349\": a valid label must be an empty string or consist of alphanumeric characters, '-', '_' or '.', and must start and end with an alphanumeric character (e.g. 'MyValue',  or 'my_value',  or '12345', regex used for validation is '(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?')",
                                field: "metadata.labels",
                            },
                        ],
                    },
                    code: 422,
                },
                attemptNumber: 1,
                retriesLeft: 5,
            };
            /* tslint:enable:max-line-length no-null-keyword */
            const m = k8sErrMsg(r);
            assert(m === r.body.message);
        });

        it("should handle a 404", () => {
            /* tslint:disable:no-null-keyword */
            const r: any = {
                response: {
                    statusCode: 404,
                    body: "404 page not found\n",
                    headers: {
                        "content-type": "text/plain; charset=utf-8",
                        "x-content-type-options": "nosniff",
                        "date": "Thu, 26 Sep 2019 21:37:37 GMT",
                        "content-length": "19",
                        "connection": "close",
                    },
                    request: {
                        uri: {
                            protocol: "https:",
                            slashes: true,
                            auth: null,
                            host: "h:8443",
                            port: "8443",
                            hostname: "h",
                            hash: null,
                            search: null,
                            query: null,
                            pathname: "/apis/application/v1/namespaces/default/deployments",
                            path: "/apis/application/v1/namespaces/default/deployments",
                            href: "https://h:8443/apis/application/v1/namespaces/default/deployments",
                        },
                        method: "POST",
                        headers: {
                            "authorization": "",
                            "accept": "application/json",
                            "content-type": "application/json",
                            "content-length": 348,
                        },
                    },
                },
                body: "404 page not found\n",
                attemptNumber: 1,
                retriesLeft: 5,
            };
            /* tslint:disable:no-null-keyword */
            const m = k8sErrMsg(r);
            assert(m === "404 page not found\n");
        });

        it("should stringify something without a message", () => {
            const r = {
                blitzenTrapper: "Furr",
            };
            const m = k8sErrMsg(r);
            const e = `Kubernetes API request error: {"blitzenTrapper":"Furr"}`;
            assert(m === e);
        });

        it("should handle an array", () => {
            const r = ["Blitzen", "Trapper", "Furr"];
            const m = k8sErrMsg(r);
            const e = JSON.stringify(r);
            assert(m === e);
        });

        it("should handle a string", () => {
            const r = "Blitzen Trapper";
            const m = k8sErrMsg(r);
            assert(m === r);
        });

        it("should safely stringify something without a message", () => {
            const r = {
                authentication: {
                    header: "Saturday Nite",
                },
                blitzenTrapper: "Furr",
                token: "Gold for Bread",
                Key: "Love U",
                passWords: ["War on Machines", "Lady on the Water"],
                song: {
                    JWT: "Echo/Always On/Easy Con",
                },
            };
            const m = k8sErrMsg(r);
            const e = "Kubernetes API request error: " +
                `{"blitzenTrapper":"Furr","token":"**************","Key":"******","song":{"JWT":"E*********************n"}}`;
            assert(m === e);
        });

        it("should return the response.body.message", () => {
            const r = {
                response: {
                    body: {
                        message: "Blitzen Trapper",
                    },
                },
            };
            const m = k8sErrMsg(r);
            assert(m === "Blitzen Trapper");
        });

    });

    describe("requestErrMsg", () => {

        it("should use the body", () => {
            const r: any = {
                body: "404 Not Found",
                response: {},
            };
            const m = requestErrMsg(r);
            assert(m === "404 Not Found");
        });

        it("should use the body message", () => {
            const r: any = {
                body: {
                    message: "namespaces \"defaults\" not found",
                },
                response: {},
            };
            const m = requestErrMsg(r);
            assert(m === "namespaces \"defaults\" not found");
        });

        it("should use the response body", () => {
            const r: any = {
                body: {},
                response: {
                    body: "404 Not Found",
                },
            };
            const m = requestErrMsg(r);
            assert(m === "404 Not Found");
        });

        it("should use the body message", () => {
            const r: any = {
                body: {},
                response: {
                    body: {
                        message: "namespaces \"defaults\" not found",
                    },
                },
            };
            const m = requestErrMsg(r);
            assert(m === "namespaces \"defaults\" not found");
        });

        it("should use the body message", () => {
            const r: any = {
                body: {},
                response: {
                    body: {
                        message: "namespaces \"defaults\" not found",
                    },
                },
            };
            const m = requestErrMsg(r);
            assert(m === "namespaces \"defaults\" not found");
        });

        it("should return undefined", () => {
            const rs: any[] = [
                {},
                { body: {} },
                { response: {} },
                { body: {}, response: {} },
                { body: [], response: [] },
            ];
            rs.forEach(r => {
                const m = requestErrMsg(r);
                assert(m === undefined);
            });
        });

    });

    describe("requestError", () => {

        it("should return Error with default message", () => {
            const r: any = {};
            const e = requestError(r);
            assert(e instanceof Error);
            assert(e.message === "Kubernetes API request failed");
            assert(e.body === undefined);
            assert(e.response === undefined);
        });

        it("should include body and response in Error", () => {
            const r: any = {
                body: {
                    message: "No luck",
                },
                response: {
                    Status: "Failure",
                    body: {
                        message: "No luck",
                    },
                },
            };
            const e = requestError(r);
            assert(e instanceof Error);
            assert(e.message === "No luck");
            const b = {
                message: "No luck",
            };
            const p = {
                Status: "Failure",
                body: {
                    message: "No luck",
                },
            };
            assert.deepStrictEqual(e.body, b);
            assert.deepStrictEqual(e.response, p);
        });

    });

    describe("maskString", () => {

        it("should mask entire string", () => {
            ["abcdef", "abcdef0", "abcdef012", "abcdef0123456", "abcdef012345678"].forEach(t => {
                const m = maskString(t);
                const e = "*".repeat(t.length);
                assert(m === e);
            });
        });

        it("should mask middle of string", () => {
            [
                { t: "abcdef0123456789", e: "a**************9" },
                { t: "abcdef0123456789xyz", e: "a*****************z" },
                { t: "Spaces should not be a problem.", e: "S*****************************." },
            ].forEach(t => {
                const m = maskString(t.t);
                assert(m === t.e);
            });
        });

        it("should obscure a short string", () => {
            ["", "a", "ab", "abc", "abcd", "abcde", "abcdef"].forEach(t => {
                const m = maskString(t);
                assert(m === "******");
            });
        });

        it("should truncate a long string", () => {
            const t = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+{}|:<>?`-=[]\;',./";
            const m = maskString(t);
            const e = "a*********************************************K...";
            assert(m === e);
        });

    });

});
