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

import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

import * as assert from "power-assert";
import { PushListenerInvocation } from "../../../src/api/listener/PushListener";
import { IsClojure } from "../../../src/pack/clojure/pushTests";

describe("jvmPushTests", () => {

    describe("IsClojure", () => {

        it("should not find Clojure in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await IsClojure.mapping({project} as any as PushListenerInvocation);
            assert(!r);
        });

        it("should find Clojure in repo with Clojure file", async () => {
            const project = InMemoryProject.of({ path: "src/main/java/Thing.clj", content: "(())"});
            const r = await IsClojure.mapping({project} as any as PushListenerInvocation);
            assert(r);
        });

        it("should not find Clojure in repo with no Clojure file", async () => {
            const project = InMemoryProject.of({ path: "src/main/java/Thing.kt", content: "public class Thing {}"});
            const r = await IsClojure.mapping({project} as any as PushListenerInvocation);
            assert(!r);
        });
    });

});
