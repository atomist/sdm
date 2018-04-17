import { Goals, HttpServiceGoals, NoGoals, PushListenerInvocation, PushMapping, whenPushSatisfies } from "../../../src";
import { given } from "../../../src/blueprint/dsl/decisionTree";
import { FalsePushTest, TruePushTest } from "../../common/listener/support/pushTestUtilsTest";

import * as assert from "power-assert";

const FrogPushMapping: PushMapping<string> = {name: "frog", valueForPush: async () => "frog"};

function fakePush(): PushListenerInvocation {
    return {push: {id: new Date().getTime() + "_"}}as any as PushListenerInvocation;
}

describe("given", () => {

    it("should combine true with one", async () => {
        const pm: PushMapping<any> = given(TruePushTest)
            .itMeans("frogs coming")
            .then(FrogPushMapping);
        const mapped = await pm.valueForPush(fakePush());
        assert.equal(mapped, "frog");
    });

    it("should combine false with one", async () => {
        const pm: PushMapping<any> = given(FalsePushTest)
            .itMeans("no frogs coming")
            .then(FrogPushMapping);
        const mapped = await pm.valueForPush(fakePush());
        assert.equal(mapped, undefined);
    });

    it("nest with when", async () => {
        const pm: PushMapping<Goals> = given<Goals>(TruePushTest)
            .itMeans("no frogs coming")
            .then(
                whenPushSatisfies(TruePushTest).itMeans("http").setGoals(HttpServiceGoals),
            );
        const mapped = await pm.valueForPush(fakePush());
        assert.equal(mapped, HttpServiceGoals);
    });

    it("nest with multiple when", async () => {
        const pm: PushMapping<Goals> = given<Goals>(TruePushTest)
            .itMeans("no frogs coming")
            .then(
                whenPushSatisfies(FalsePushTest).itMeans("nope").setGoals(NoGoals),
                whenPushSatisfies(TruePushTest).itMeans("yes").setGoals(HttpServiceGoals),
            );
        const mapped = await pm.valueForPush(fakePush());
        assert.equal(mapped, HttpServiceGoals);
    });

    it("nested given", async () => {
        const pm: PushMapping<Goals> = given<Goals>(TruePushTest)
            .itMeans("no frogs coming")
            .then(
                given<Goals>(TruePushTest).itMeans("case1").then(
                    whenPushSatisfies(FalsePushTest).itMeans("nope").setGoals(NoGoals),
                    whenPushSatisfies(TruePushTest).itMeans("yes").setGoals(HttpServiceGoals),
                ),
            );
        const mapped = await pm.valueForPush(fakePush());
        assert.equal(mapped, HttpServiceGoals);
    });
});
