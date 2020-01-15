import * as assert from "assert";
import { hasCommit } from "../../../lib/api-helper/pushtest/commit";
import { fakePush } from "../../../lib/api-helper/testsupport/fakePush";

describe("commit", () => {

    describe("hasCommit", () => {

        it("should detect commit message based on pattern", async () => {
            const p = fakePush();
            p.push.commits = [
                { message: "Polish" },
                { message: "Version: increment after 1.2 release" },
            ];

            const result = await hasCommit(/Version: increment after .* release/).mapping({ ...p });
            assert.strictEqual(result, true);
        });

        it("should fail if no matching commit can be found", async () => {
            const p = fakePush();
            p.push.commits = [
                { message: "Polish" },
                { message: "Version: increment after 1.2 release" },
            ];

            const result = await hasCommit(/Autofix: TypeScript Header/).mapping({ ...p });
            assert.strictEqual(result, false);
        });

    });

});
