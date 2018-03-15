import "mocha";

import { HandlerContext } from "@atomist/automation-client";
import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import {
    ApplyHeaderParameters,
    applyHeaderProjectEditor,
} from "../../../../src/software-delivery-machine/commands/editors/license/applyHeader";

describe("applyHeaderEditor", () => {

    it("should apply", async () => {
        const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
            {path: "src/main/java/Thing.java", content: WithHeader},
            {path: "src/main/java/Thing1.java", content: "public class Thing1 {}"});
        const params = new ApplyHeaderParameters(ApacheHeader);
        await applyHeaderProjectEditor(p, {teamId: "anything"} as HandlerContext, params);
        assert(p.fileExistsSync("src/main/java/Thing1.java"));
        const content = p.findFileSync("src/main/java/Thing1.java").getContentSync();
        assert(content.startsWith(ApacheHeader));
    });

});

/* tslint:disable */
const ApacheHeader = `/*
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
 */`;

const WithHeader = `${ApacheHeader}
 
 public class Thing {}`;
