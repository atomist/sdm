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

import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { IsLein, LibraryGoals, PushListenerInvocation, PushRules, whenPushSatisfies } from "../../../src";

describe("Construction of PushRules", () => {

    it("Does not think an empty project is a lein project", async () => {
        const rule = new PushRules("test", [whenPushSatisfies(IsLein)
            .itMeans("Build a Clojure library")
            .setGoals(LibraryGoals)]);

        const project = InMemoryProject.from({owner: "yes", repo: "no"},
            {path: "package.json", content: "{}"});
        const fakePush = {id: "test1"};
        const result = await rule.mapping({project, push: fakePush} as any as PushListenerInvocation);

        assert(!result);

    });

    it("Does think a lein project is a lein project", async () => {
        const rule = new PushRules("test", [whenPushSatisfies(IsLein)
            .itMeans("Build a Clojure library")
            .setGoals(LibraryGoals)]);

        const project = InMemoryProject.from({owner: "yes", repo: "no"},
            {path: "project.clj", content: "{}"});
        const fakePush = {id: "ttest2"};
        const result = await rule.mapping({project, push: fakePush} as any as PushListenerInvocation);

        assert(result);

    });
});
