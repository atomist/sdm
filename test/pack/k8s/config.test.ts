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
    mergeK8sOptions,
    validSyncOptions,
} from "../../../lib/pack/k8s/config";

describe("pack/k8s/config", () => {

    describe("validSyncOptions", () => {

        it("should return false if all missing", () => {
            const o = {};
            assert(!validSyncOptions(o));
        });

        it("should return false if passed undefined", () => {
            assert(!validSyncOptions(undefined));
        });

        it("should return true if all present", () => {
            const o: any = {
                repo: {
                    owner: "paul-westerberg",
                    repo: "14-songs",
                },
            };
            assert(validSyncOptions(o));
        });

    });

    describe("mergeK8sOptions", () => {

        it("should successfully merge nothing", () => {
            const ss: any[] = [
                {},
                { configuration: {} },
                { configuration: { sdm: {} } },
                { configuration: { sdm: { k8s: {} } } },
            ];
            const e = {
                configuration: {
                    sdm: {
                        k8s: {
                            options: {},
                        },
                    },
                },
            };
            ss.forEach(s => {
                const r = mergeK8sOptions(s);
                assert.deepStrictEqual(r, e);
            });
        });

        it("should successfully set provided options", () => {
            const s: any = {
                configuration: {
                    sdm: {},
                },
            };
            const o = {
                addCommands: false,
                registerCluster: true,
            };
            const r = mergeK8sOptions(s, o);
            const e = {
                configuration: {
                    sdm: {
                        k8s: {
                            options: {
                                addCommands: false,
                                registerCluster: true,
                            },
                        },
                    },
                },
            };
            assert.deepStrictEqual(r, e);
        });

        it("should use SDM values over options values", () => {
            const s: any = {
                configuration: {
                    sdm: {
                        k8s: {
                            options: {
                                addCommands: true,
                                registerCluster: false,
                            },
                        },
                    },
                },
            };
            const o = {
                addCommands: false,
                registerCluster: true,
            };
            const r = mergeK8sOptions(s, o);
            const e = {
                configuration: {
                    sdm: {
                        k8s: {
                            options: {
                                addCommands: true,
                                registerCluster: false,
                            },
                        },
                    },
                },
            };
            assert.deepStrictEqual(r, e);
        });

        it("should safely perform a complex merge", () => {
            const f = () => false;
            const u = async () => { return; };
            const s: any = {
                addExtensionPacks: f,
                configuration: {
                    apiKey: "BR34TH",
                    sdm: {
                        k8s: {
                            options: {
                                addCommands: true,
                                registerCluster: false,
                                sync: {
                                    repo: {
                                        branch: "nearly-lost-you",
                                    },
                                    intervalMinutes: 5,
                                    specFormat: "json",
                                },
                            },
                            waiting: {
                                for: "somebody",
                            },
                        },
                        seasons: {
                            dyslexic: "heart",
                        },
                    },
                },
                name: "@the/stooges",
            };
            const o = {
                addCommands: false,
                registerCluster: true,
                sync: {
                    repo: {
                        owner: "battle-of-evermore",
                        repo: "chloe_dancer",
                        setUserConfig: u,
                    },
                    secretKey: "Would?",
                    specFormat: "yaml" as "yaml",
                },
            };
            const r = mergeK8sOptions(s, o);
            const e = {
                addExtensionPacks: f,
                configuration: {
                    apiKey: "BR34TH",
                    sdm: {
                        k8s: {
                            options: {
                                addCommands: true,
                                registerCluster: false,
                                sync: {
                                    repo: {
                                        branch: "nearly-lost-you",
                                        owner: "battle-of-evermore",
                                        repo: "chloe_dancer",
                                        setUserConfig: u,
                                    },
                                    intervalMinutes: 5,
                                    secretKey: "Would?",
                                    specFormat: "json",
                                },
                            },
                            waiting: {
                                for: "somebody",
                            },
                        },
                        seasons: {
                            dyslexic: "heart",
                        },
                    },
                },
                name: "@the/stooges",
            };
            assert.deepStrictEqual(r, e);
        });

    });

});
