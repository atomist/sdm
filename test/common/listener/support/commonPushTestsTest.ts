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

import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

import * as assert from "power-assert";
import { PushListenerInvocation } from "../../../../src/common/listener/PushListener";
import { hasFile, hasFileContaining } from "../../../../src/common/listener/support/pushtest/commonPushTests";

describe("commonPushTests", () => {

    describe("hasFile", () => {

        it("should not find file in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await hasFile("whatever").valueForPush({project} as any as PushListenerInvocation);
            assert(!r);
        });

        it("should find file", async () => {
            const project = InMemoryProject.of({ path: "pom.xml", content: "<xml>"});
            const r = await hasFile("pom.xml").valueForPush({project} as any as PushListenerInvocation);
            assert(r);
        });
    });

    describe("hasFileContaining", () => {

        it("should not find in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await hasFileContaining("x", /y/).valueForPush({project} as any as PushListenerInvocation);
            assert(!r);
        });

        it("should find containing", async () => {
            const project = InMemoryProject.of({ path: "src/main/java/Thing.java", content: "public class Thing {}"});
            const r = await hasFileContaining("src/main/java/Thing.java", /class/).valueForPush({project} as any as PushListenerInvocation);
            assert(r);
        });

        it("should not find whe file does not contain", async () => {
            const project = InMemoryProject.of({ path: "src/main/java/Thing.kt", content: "public class Thing {}"});
            const r = await hasFileContaining("src/main/java/Thing.java", /xclass/).valueForPush({project} as any as PushListenerInvocation);
            assert(!r);
        });
    });

});
