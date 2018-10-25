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

import { GitHubRepoRef } from "@atomist/automation-client";

import * as assert from "power-assert";
import { PushListenerInvocation } from "../../../../lib/api/listener/PushListener";
import {
    ProjectPredicate,
    pushTest,
    PushTest,
} from "../../../../lib/api/mapping/PushTest";
import {
    allSatisfied,
    anySatisfied,
    not,
} from "../../../../lib/api/mapping/support/pushTestUtils";

export const TruePushTest: PushTest = pushTest("true", async () => true);

export function falsePushTest(): PushTest { return  pushTest("false", async () => false)};

export const TrueProjectPredicate: ProjectPredicate = async () => true;

export const FalseProjectPredicate: ProjectPredicate = async () => false;

export const BigProject: ProjectPredicate = async p => (await p.totalFileCount()) > 100;

const id = new GitHubRepoRef("atomist", "github-sdm");

describe("pushTestUtilsTest", () => {

    describe("not", () => {

        it("should handle one true", async () => {
            const r = await not(TruePushTest).mapping({id} as any as PushListenerInvocation);
            assert(!r);
        });

        it("should handle one false", async () => {
            const r = await not(falsePushTest()).mapping({id} as any as PushListenerInvocation);
            assert(r);
        });

    });

    describe("allPredicatesSatisfied", () => {

        describe("with PushTest", () => {

            it("should handle one true", async () => {
                const r = await allSatisfied(TruePushTest).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle two true", async () => {
                const r = await allSatisfied(TruePushTest, TruePushTest).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle one true and one false", async () => {
                const r = await allSatisfied(TruePushTest, falsePushTest()).mapping({id} as any as PushListenerInvocation);
                assert(!r);
            });
        });

        describe("with ProjectPredicate", () => {

            it("should handle one true", async () => {
                const r = await allSatisfied(TrueProjectPredicate).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle two true", async () => {
                const r = await allSatisfied(TrueProjectPredicate, TrueProjectPredicate).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle one true and one false", async () => {
                const r = await allSatisfied(TrueProjectPredicate, FalseProjectPredicate).mapping({id} as any as PushListenerInvocation);
                assert(!r);
            });
        });

    });

    describe("anyPredicateSatisfied", () => {

        describe("with PushTest", () => {

            it("should handle one true", async () => {
                const r = await anySatisfied(TruePushTest).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle two true", async () => {
                const r = await anySatisfied(TruePushTest, TruePushTest).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle one true and one false", async () => {
                const r = await anySatisfied(TruePushTest, falsePushTest()).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle two false", async () => {
                const r = await anySatisfied(falsePushTest(), falsePushTest()).mapping({id} as any as PushListenerInvocation);
                assert(!r);
            });

        });

        describe("with ProjectPredicate", () => {

            it("should handle one true", async () => {
                const r = await anySatisfied(TrueProjectPredicate).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle two true", async () => {
                const r = await anySatisfied(TrueProjectPredicate, TrueProjectPredicate).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle one true and one false", async () => {
                const r = await anySatisfied(TrueProjectPredicate, FalseProjectPredicate).mapping({id} as any as PushListenerInvocation);
                assert(r);
            });

            it("should handle two false", async () => {
                const r = await anySatisfied(FalseProjectPredicate, FalseProjectPredicate).mapping({id} as any as PushListenerInvocation);
                assert(!r);
            });

        });

    });

});
