/*
 * Copyright © 2019 Atomist, Inc.
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

import {
    HandlerContext,
    HandlerResult,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
    Success,
    Tags,
} from "@atomist/automation-client";
import { ConfigurableCommandHandler } from "@atomist/automation-client/lib/decorators";
import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { metadataFromInstance } from "@atomist/automation-client/lib/internal/metadata/metadataReading";
import { CommandHandlerMetadata } from "@atomist/automation-client/lib/metadata/automationMetadata";
import { toFactory } from "@atomist/automation-client/lib/util/constructionUtils";
import * as assert from "power-assert";
import { adaptHandleCommand } from "../../../lib/api-helper/machine/adaptHandleCommand";

describe("adaptHandleCommand", () => {

    it("should adapt simple HelloWorld", async () => {
        const cd = adaptHandleCommand(HelloWorld);
        assert.strictEqual(cd.name, "HelloWorld");
        assert.strictEqual(cd.description, "desc");
        assert.deepStrictEqual(cd.intent, ["intent"]);
        assert.strictEqual(cd.autoSubmit, true);

        // tslint:disable:deprecation
        const md = metadataFromInstance(toFactory(cd.paramsMaker)()) as CommandHandlerMetadata;
        assert.strictEqual(md.parameters[0].description, "test");
        assert.strictEqual(md.secrets[0].uri, Secrets.userToken("repo"));
        assert.strictEqual(md.mapped_parameters[0].uri, MappedParameters.SlackUser);
    });

});

@ConfigurableCommandHandler("desc", { autoSubmit: true, intent: "intent" })
@Tags("test1", "test2")
class HelloWorld implements HandleCommand {

    @Parameter({ description: "test" })
    public test: string;

    @Secret(Secrets.userToken("repo"))
    public token: string;

    @MappedParameter(MappedParameters.SlackUser)
    public userId: string;

    public async handle(ctx: HandlerContext): Promise<HandlerResult> {
        return Success;
    }

}
