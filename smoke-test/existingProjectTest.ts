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
import { AffirmationEditorName } from "../src/software-delivery-machine/commands/editors/demo/affirmationEditor";
import { editorOneInvocation, invokeCommandHandler } from "./framework/CommandHandlerInvocation";
import { TestConfig } from "./fixture";

const RepoToTest = "losgatos1";

describe("test against existing project", () => {

        it("changes readme", async () => {
            const handlerResult = await invokeCommandHandler(TestConfig,
                editorOneInvocation(AffirmationEditorName, TestConfig.githubOrg, RepoToTest));
        }).timeout(10000);

    });
