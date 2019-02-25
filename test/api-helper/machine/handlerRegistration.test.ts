import * as assert from "power-assert";
import { resolveCredentialsPromise } from "../../../lib/api-helper/machine/handlerRegistrations";

describe("handlerRegistration", () => {

    describe("resolveCredentialsPromise", () => {

        it("should resolve undefined", async () => {
            const pr = await resolveCredentialsPromise(undefined);
            assert(pr === undefined);
        });

        it("should resolve promise credentials", async () => {
            const creds = { token: "123456" };
            const pr = await resolveCredentialsPromise(Promise.resolve(creds));
            assert.strictEqual(pr, creds);
        });

        it("should resolve resolve credentials value", async () => {
            const creds = { token: "123456" };
            const pr = await resolveCredentialsPromise(creds);
            assert.strictEqual(pr, creds);
        });

    });

});
