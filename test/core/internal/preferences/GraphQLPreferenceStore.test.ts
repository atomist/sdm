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

// tslint:disable:deprecation

import * as _ from "lodash";
import { PreferenceScope } from "../../../../lib/api/context/preferenceStore";
import { GraphQLPreferenceStore } from "../../../../lib/core/internal/preferences/GraphQLPreferenceStore";
import { assertPreferences } from "./preferences";

describe("GraphQLPreferenceStore", () => {

    const ctx = store => ({
        messageClient: {
            send: async msg => {
                store[msg.key] = msg;
            },
        },
        graphClient: {
            query: async opts => {
                if (!!opts.variables && !!opts.variables.key) {
                    if (!!store[opts.variables.key]) {
                        return {
                            SdmPreference: [store[opts.variables.key]],
                        };
                    } else {
                        return {
                            SdmPreference: undefined,
                        };
                    }
                } else {
                    const prefs = [];
                    _.forEach(store, v => prefs.push(v));
                    return {
                        SdmPreference: prefs,
                    };
                }
            },
        },
        configuration: {
            name: "my-sdm",
        },
    });

    it("should correctly handle preferences", async () => {
        const store = {};
        const prefs = new GraphQLPreferenceStore(ctx(store) as any);
        await assertPreferences(prefs);
    }).timeout(5000);

    it("should correctly handle scoped preferences", async () => {
        const store = {};
        const prefs = new GraphQLPreferenceStore(ctx(store) as any);
        await assertPreferences(prefs, PreferenceScope.Sdm);
    }).timeout(5000);

});
