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

import { PreferenceScope } from "../../../lib/api/context/preferenceStore";
import { TeamConfigurationPreferenceStore } from "../../../lib/core/preferences/TeamConfigurationPreferenceStore";
import { assertPreferences } from "./preferences";

describe("TeamConfigurationPreferenceStore", () => {

    const ctx = store => ({
        graphClient: {
            query: async opts => {
                if (!!store[opts.variables.namespace]) {
                    const prefs = store[opts.variables.namespace].filter(p => {
                        if (!!p.ttl) {
                            return p.ttl + p.createdAt.getTime() >= new Date().getTime();
                        }
                        return true;
                    });
                    return {
                        TeamConfiguration: prefs,
                    };
                } else {
                    return {
                        TeamConfiguration: undefined,
                    };
                }
            },
            mutate: async opts => {
                if (opts.name === "SetTeamConfiguration") {
                    store[opts.variables.namespace] = [{
                        name: opts.variables.name,
                        namespace: opts.variables.namespace,
                        value: opts.variables.value,
                        ttl: opts.variables.ttl,
                        createdAt: new Date(),
                    }];
                } else if (opts.name === "DeleteTeamConfiguration") {
                    store[opts.variables.namespace] =
                        store[opts.variables.namespace].filter(p => p.name !== opts.variables.name);
                }
            },
        },
        configuration: {
            name: "my-sdm",
        },
    });

    it("should correctly handle preferences", async () => {
        const store = {};
        const prefs = new TeamConfigurationPreferenceStore(ctx(store) as any);
        await assertPreferences(prefs);
    }).timeout(5000);

    it("should correctly handle scoped preferences", async () => {
        const store = {};
        const prefs = new TeamConfigurationPreferenceStore(ctx(store) as any);
        await assertPreferences(prefs, PreferenceScope.Sdm);
    }).timeout(5000);

});
