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
import { HasSpringBootApplicationClass } from "../../../../src/common/listener/support/pushtest/jvm/springPushTests";
import { springBootPom } from "../../../software-delivery-machine/editors/TestPoms";

describe("springPushTests", () => {

    describe("HasSpringBootApplicationClass", () => {

        it("should not find maven in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await HasSpringBootApplicationClass.valueForPush({project} as any as PushListenerInvocation);
            assert(!r);
        });

        it("should find maven in repo with named pom but no Spring application", async () => {
            const project = InMemoryProject.of({ path: "pom.xml", content: "<xml>"});
            const r = await HasSpringBootApplicationClass.valueForPush({project} as any as PushListenerInvocation);
            assert(!r);
        });

        it("should find in repo with named pom and Spring application class", async () => {
            const project = InMemoryProject.of(
                { path: "pom.xml", content: springBootPom("1.2.1")},
                { path: "src/main/java/App.java", content: "@SpringBootApplication public class App {}"},
                );
            const r = await HasSpringBootApplicationClass.valueForPush({project} as any as PushListenerInvocation);
            assert(r);
        });
    });

});
