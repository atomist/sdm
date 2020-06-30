/*
 * Copyright © 2020 Atomist, Inc.
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

import * as assert from "power-assert";
import {
    defaultValidName,
    nameMatch,
    validName,
} from "../../../../lib/pack/k8s/kubernetes/name";

describe("pack/k8s/kubernetes/name", () => {

    describe("validName", () => {

        const validation = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;

        it("should not change a valid name", () => {
            const n = "kat3bu5h-cloudbusting5";
            const v = validName(n);
            assert(validation.test(v));
            assert(n === v);
        });

        it("should return something valid when an empty string results", () => {
            ["", "---", "01234", "___"].forEach(n => {
                const v = validName(n);
                assert(validation.test(v));
                assert(v === defaultValidName);
            });
        });

        it("should fix an invalid name", () => {
            const n = "Kat3Bu5h_Cloudbusting5.";
            const v = validName(n);
            assert(validation.test(v));
            const e = "kat3bu5h-cloudbusting5";
            assert(v === e);
        });

        it("should truncate a long name", () => {
            const n = "a234567891123456789212345678931234567894123456789512345678961234";
            const v = validName(n);
            assert(validation.test(v));
            const e = "a23456789112345678921234567893123456789412345678951234567896123";
            assert(v === e);
        });

        it("should properly truncate a complex long name", () => {
            const n = "A23456789112345678921234567893_234567894123456789512345678961.?456789";
            const v = validName(n);
            assert(validation.test(v));
            const e = "a23456789112345678921234567893-234567894123456789512345678961";
            assert(v === e);
        });

    });

    describe("nameMatch", () => {

        it("should match a string", () => {
            const v = "sicilian-crest";
            const m = "sicilian-crest";
            assert(nameMatch(v, m));
        });

        it("should match a regular expression", () => {
            const v = "sicilian-crest";
            const m = /cilian-cr/;
            assert(nameMatch(v, m));
        });

        it("should not match a string", () => {
            const v = "sicilian-crest";
            const m = "sicilian-crust";
            assert(!nameMatch(v, m));
        });

        it("should not match a regular expression", () => {
            const v = "sicilian-crest";
            const m = /cilain-cr/;
            assert(!nameMatch(v, m));
        });

        it("should throw an error if matcher is neither a string nor regular expression", () => {
            const v = "sicilian-crest";
            const m: any = 2019;
            assert.throws(() => nameMatch(v, m), /Provided matcher is neither a string or RegExp: /);
        });

        it("should match an empty string", () => {
            const v = "";
            const m = "";
            assert(nameMatch(v, m));
        });

        it("should match when no matcher", () => {
            const v = "sicilian-crest";
            assert(nameMatch(v));
            assert(nameMatch(v, undefined));
        });

    });

});
