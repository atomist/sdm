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

import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { formatDate } from "../../../../lib/api-helper/misc/dateFormat";
import { PreferenceScope } from "../../../../lib/api/context/preferenceStore";
import { FilePreferenceStore } from "../../../../lib/core/internal/preferences/FilePreferenceStore";
import { assertPreferences } from "./preferences";

describe("FilePreferenceStore", () => {

    it("should correctly handle preferences", async () => {
        const p = path.join(os.homedir(), ".atomist", "prefs", `client.prefs-${formatDate()}.json`);
        const prefs = new FilePreferenceStore({ configuration: { name: "my-sdm" } } as any, p);
        await assertPreferences(prefs);
        await fs.unlink(p);
    }).timeout(5000);

    it("should correctly handle scoped preferences", async () => {
        const p = path.join(os.homedir(), ".atomist", "prefs", `client.prefs-${formatDate()}.json`);
        const prefs = new FilePreferenceStore({ configuration: { name: "my-sdm" } } as any, p);
        await assertPreferences(prefs, PreferenceScope.Sdm);
        await fs.unlink(p);
    }).timeout(5000);

});
