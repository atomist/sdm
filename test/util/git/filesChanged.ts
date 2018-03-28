/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import "mocha";

import * as assert from "power-assert";
import { anyFileChangedSuchThat, anyFileChangedWithExtension } from "../../../src/util/git/filesChangedSince";

describe("filesChanged", () => {

    describe("anyFileChangedSuchThat", () => {

        it("should recognize passing", () => {
            assert(anyFileChangedSuchThat(["path", "path/2"], path => path.startsWith("path")));
        });

        it("should recognize test", () => {
            assert(!anyFileChangedSuchThat(["path", "path/2"], path => path.startsWith("xpath")));
        });
    });

    describe("anyFileChangedWithExtension", () => {

        it("should recognize extension", () => {
            assert(anyFileChangedWithExtension(["path.c", "path/two.java"], ["c"]));
        });

        it("should recognize extension from list", () => {
            assert(anyFileChangedWithExtension(["path.c", "path/two.java"], ["java"]));
        });

        it("should recognize extension without dot", () => {
            assert(anyFileChangedWithExtension(["path.c", "path/two.java"], ["c"]));
        });

        it("should recognize no suc extension", () => {
            assert(!anyFileChangedWithExtension(["path.c", "path/two.java"], ["graphql"]));
        });
    });

});
