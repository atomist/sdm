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

import * as assert from "assert";
import { guessSourceLocation } from "../../../lib/api/registration/RegistrationSourceLocation";

describe("guessSourceLocation", () => {
    it("can guess this source location", async () => {
        const result = guessSourceLocation();
        assert(!!result, "No result returned");
        assert(!!result.url, "No url returned");
        assert(result.url.startsWith("https://github.com/atomist/sdm/blob/"),
            "where is the repo part of the link? <" + result.url + ">");
        // this is dependent on location of this file, and line in this file
        assert(result.url.endsWith("test/api/registration/registrationSourceLocation.test.ts#L22"),
            "where is the file part of the link? " + result.url);
        assert(!result.url.includes("/Users"), "nooo, the local path is in it: <" + result.url + ">");
    });
});
