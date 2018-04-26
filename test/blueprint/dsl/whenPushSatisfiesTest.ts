import * as assert from "power-assert";
import { HttpServiceGoals, whenPushSatisfies } from "../../../src";
import { fakePush } from "./decisionTreeTest";

describe("whenPushSatisfies", () => {

    it("should satisfy true", async () => {
        const test = await whenPushSatisfies(true).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), HttpServiceGoals);
    });

    it("should not satisfy false", async () => {
        const test = await whenPushSatisfies(false).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), undefined);
    });

    it("should satisfy function returning true", async () => {
        const test = await whenPushSatisfies(() => true).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), HttpServiceGoals);
    });

    it("should not satisfy function returning false", async () => {
        const test = await whenPushSatisfies(() => false).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), undefined);
    });

    it("should satisfy function returning promise true", async () => {
        const test = await whenPushSatisfies(async () => true).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), HttpServiceGoals);
    });

    it("should not satisfy function returning promise false", async () => {
        const test = await whenPushSatisfies(async () => false).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), undefined);
    });
});
