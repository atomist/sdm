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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import "mocha";
import * as assert from "power-assert";
import { ProjectListenerInvocation } from "../../../../src/common/listener/Listener";
import { PushTest, pushTest } from "../../../../src/common/listener/PushTest";
import { allSatisfied, anySatisfied } from "../../../../src/common/listener/support/pushtest/pushTestUtils";

export const TruePushTest: PushTest = pushTest("true", async () => true);

export const FalsePushTest: PushTest = pushTest("false", async () => false);

const id = new GitHubRepoRef("atomist", "github-sdm");

describe("pushTestUtilsTest", () => {

    describe("allSatisfied", () => {

        it("should handle one true", async () => {
            const r = await allSatisfied(TruePushTest).valueForPush({id } as any as ProjectListenerInvocation);
            assert(r === true);
        });

        it("should handle two true", async () => {
            const r = await allSatisfied(TruePushTest, TruePushTest).valueForPush({id } as any as ProjectListenerInvocation);
            assert(r === true);
        });

        it("should handle one true and one false", async () => {
            const r = await allSatisfied(TruePushTest, FalsePushTest).valueForPush({id } as any as ProjectListenerInvocation);
            assert(r === false);
        });

    });

    describe("anySatisfied", () => {

        it("should handle one true", async () => {
            const r = await anySatisfied(TruePushTest).valueForPush({id } as any as ProjectListenerInvocation);
            assert(r === true);
        });

        it("should handle two true", async () => {
            const r = await anySatisfied(TruePushTest, TruePushTest).valueForPush({id } as any as ProjectListenerInvocation);
            assert(r === true);
        });

        it("should handle one true and one false", async () => {
            const r = await anySatisfied(TruePushTest, FalsePushTest).valueForPush({id } as any as ProjectListenerInvocation);
            assert(r === true);
        });

        it("should handle two false", async () => {
            const r = await anySatisfied(FalsePushTest, FalsePushTest).valueForPush({id } as any as ProjectListenerInvocation);
            assert(r === false);
        });

    });

});
