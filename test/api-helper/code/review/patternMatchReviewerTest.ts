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

import { AllFiles } from "@atomist/automation-client/project/fileGlobs";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { patternMatchReviewer } from "../../../../src/api-helper/code/review/patternMatchReviewer";
import { PushImpactListenerInvocation } from "../../../../src/api/listener/PushImpactListener";
import { ReviewerRegistration } from "../../../../src/api/registration/ReviewerRegistration";

describe("patternMatchReviewer", () => {

    it("should not find anything", async () => {
        const rer: ReviewerRegistration = patternMatchReviewer("name",
            {globPattern: AllFiles},
            {
                name: "t thing",
                antiPattern: /t.*/,
                comment: "something else",
            });
        const project = InMemoryProject.of(new InMemoryFile("a", "b"));
        const rr = await rer.action({project} as any as PushImpactListenerInvocation);
        assert.equal(rr.comments.length, 0);
    });

    it("should find regex", async () => {
        const rer: ReviewerRegistration = patternMatchReviewer("name",
            {globPattern: AllFiles},
            {
                name: "t thing",
                antiPattern: /t.*/,
                comment: "something else",
            });
        const project = InMemoryProject.of(new InMemoryFile("thing", "b test"));
        const rr = await rer.action({project} as any as PushImpactListenerInvocation);
        assert.equal(rr.comments.length, 1);
        assert.equal(rr.comments[0].sourceLocation.path, "thing");
    });

    it("should not find string", async () => {
        const rer: ReviewerRegistration = patternMatchReviewer("name",
            {globPattern: AllFiles},
            {
                name: "t thing",
                antiPattern: "frogs suck",
                comment: "something else",
            });
        const project = InMemoryProject.of(new InMemoryFile("thing", "b test"));
        const rr = await rer.action({project} as any as PushImpactListenerInvocation);
        assert.equal(rr.comments.length, 0);
    });

    it("should find string", async () => {
        const rer: ReviewerRegistration = patternMatchReviewer("name",
            {globPattern: AllFiles},
            {
                name: "t thing",
                antiPattern: "frogs suck",
                comment: "something else",
            });
        const project = InMemoryProject.of(new InMemoryFile("thing", "b frogs suck test"));
        const rr = await rer.action({project} as any as PushImpactListenerInvocation);
        assert.equal(rr.comments.length, 1);
        assert.equal(rr.comments[0].sourceLocation.path, "thing");
    });

    it("should find complex string", async () => {
        const rer: ReviewerRegistration = patternMatchReviewer("name",
            {globPattern: AllFiles},
            {
                name: "t thing",
                antiPattern: "frogs /[&(* suck",
                comment: "something else",
            });
        const project = InMemoryProject.of(new InMemoryFile("thing", "b frogs /[&(* suck test"));
        const rr = await rer.action({project} as any as PushImpactListenerInvocation);
        assert.equal(rr.comments.length, 1);
        assert.equal(rr.comments[0].sourceLocation.path, "thing");
    });

});
