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

import * as assert from "power-assert";
import {
    PreferenceScope,
    PreferenceStore,
} from "../../../../lib/api/context/preferenceStore";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function assertPreferences(prefs: PreferenceStore, scope?: PreferenceScope): Promise<void> {
    assert(!(await prefs.get("foo", { scope })));
    assert(await prefs.get<boolean>("foo", { scope, defaultValue: true }));
    await prefs.put("foo", "bar", { scope });
    assert.strictEqual(await prefs.get("foo", { scope }), "bar");
    assert.deepStrictEqual(await prefs.list(scope), [{ key: "foo", value: "bar" }]);
    await prefs.delete("foo", { scope });
    assert(!(await prefs.get("foo", { scope })));

    await prefs.put("foo", "barbar", { scope });
    assert.strictEqual(await prefs.get("foo", { scope }), "barbar");

    const tempScope = new Date().toISOString();
    await prefs.put("foo", "barbar", { scope: tempScope });
    assert.strictEqual(await prefs.get("foo", { scope: tempScope }), "barbar");

    await prefs.put("bar", "foo", { scope, ttl: 1000 });
    await sleep(2000);
    assert(!(await prefs.get("bar", { scope })));

    const b = { foo: "bar" };
    await prefs.put("bar", b, { scope });
    assert.deepStrictEqual((await prefs.get("bar", { scope })), b);
    assert(!(await prefs.get(
        "bar",
        { scope: scope === PreferenceScope.Sdm ? PreferenceScope.Workspace : PreferenceScope.Sdm })),
    );
}
