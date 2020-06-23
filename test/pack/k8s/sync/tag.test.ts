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

import { Configuration } from "@atomist/automation-client/lib/configuration";
import * as assert from "power-assert";
import { commitTag } from "../../../../lib/pack/k8s/sync/tag";

describe("pack/k8s/sync/tag", () => {

    describe("commitTag", () => {

        it("should safely parse nothing", () => {
            // tslint:disable-next-line:no-null-keyword
            [undefined, null, {}, { version: "0.1.0" }].forEach((c: Configuration) => {
                const t = commitTag(c);
                const e = "[atomist:sync-commit=@atomist/sdm-pack-k8s]";
                assert(t === e);
            });
        });

        it("should return tag with name", () => {
            const c: Configuration = {
                name: "@atomist/sdm-pack-k8s_new-york",
                version: "0.1.0",
            };
            const t = commitTag(c);
            const e = "[atomist:sync-commit=@atomist/sdm-pack-k8s_new-york]";
            assert(t === e);
        });

    });

});
