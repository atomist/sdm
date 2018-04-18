import * as assert from "power-assert";
import { createEphemeralProgressLog } from "../../../src";
import { spawnAndWatch, SpawnCommand } from "../../../src/util/misc/spawned";

describe("spawned", () => {

    it("should handle invalid command", async () => {
        const sc: SpawnCommand = {command: "thisIsNonsense"};
        try {
            await spawnAndWatch(sc, {},
                await createEphemeralProgressLog(),
                {});
            assert.fail("Should have thrown an exception");
        } catch (err) {
            // Ok
        }
    });

    it("should handle valid command", async () => {
        const sc: SpawnCommand = {command: "ls"};
        const r = await spawnAndWatch(sc, {},
            await createEphemeralProgressLog(),
            {});
        assert.equal(r.error, false);
        assert.equal(r.error, false);
    });

});
