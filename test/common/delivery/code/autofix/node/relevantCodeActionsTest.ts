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
import axios from "axios";

import * as assert from "power-assert";
import {
    AutofixRegistration,
    editorAutofixRegistration,
} from "../../../../../../src/common/delivery/code/autofix/AutofixRegistration";
import { tslintFix } from "../../../../../../src/common/delivery/code/autofix/node/tslint";
import { relevantCodeActions } from "../../../../../../src/common/delivery/code/CodeActionRegistration";
import { CodeReactionInvocation } from "../../../../../../src/common/listener/CodeReactionListener";

describe("relevantCodeActions", () => {

    it("should match action without push test", async () => {
        const pti: CodeReactionInvocation = null;
        const autofixes: AutofixRegistration = editorAutofixRegistration({
            name: "License Fix",
            editor: async p => {
                const license = await axios.get("https://www.apache.org/licenses/LICENSE-2.0.txt");
                return p.addFile("LICENSE", license.data);
            },
        });
        const relevant = await relevantCodeActions([autofixes], pti);
        assert.equal(relevant.length, 1);
    });

    it("should ignore irrelevant", async () => {
        const pti: CodeReactionInvocation = {
            project: new InMemoryProject(),
            push: {
                id: "x",
            },
        } as any as CodeReactionInvocation;
        const relevant = await relevantCodeActions([tslintFix], pti);
        assert.equal(relevant.length, 0);
    });

});
