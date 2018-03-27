import "mocha";
import { TruePushTest } from "./pushTestUtilsTest";
import { PushRules } from "../../../../src/common/listener/support/PushRules";
import * as assert from "power-assert";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { PushTest, pushTest } from "../../../../src/common/listener/PushTest";

export const UndefinedPushTest: PushTest = pushTest("true", async () => undefined);
export const NullPushTest: PushTest = pushTest("true", async () => null);


describe("PushRules", () => {

    it("should match one", async () => {
        const pm = TruePushTest;
        const pr = new PushRules("", [pm]);
        assert(await pr.valueForPush({id: new GitHubRepoRef("a", "b")} as any) === true);
    });

    it("should not match undefined", async () => {
        const pr = new PushRules("", [UndefinedPushTest]);
        assert(await pr.valueForPush({id: new GitHubRepoRef("a", "b")} as any) === undefined);
    });

    it("should match undefined and one", async () => {
        const pm = TruePushTest;
        const pr = new PushRules("", [UndefinedPushTest, pm]);
        assert(await pr.valueForPush({id: new GitHubRepoRef("a", "b")} as any) === true);
    });

    it("should return undefined on null and one", async () => {
        const pm = TruePushTest;
        const pr = new PushRules("", [NullPushTest, pm]);
        assert(await pr.valueForPush({id: new GitHubRepoRef("a", "b")} as any) === undefined);
    });

});