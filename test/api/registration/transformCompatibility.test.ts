/*
 * Copyright © 2018 Atomist, Inc.
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
import {
    CodeTransform,
    ExplicitCodeTransform,
} from "../../../lib/api/registration/CodeTransform";

describe("ExplicitTransform", () => {

    it("should be compatible with CodeTransform", () => {
        const ext: ExplicitCodeTransform = async (p, ci, params) => ({ target: p, success: true, edited: false});
        const tr: CodeTransform = ext;
        assert(!!tr);
    });

});
