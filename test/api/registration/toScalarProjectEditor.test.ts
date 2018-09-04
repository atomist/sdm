import { toScalarProjectEditor } from "../../../src/api-helper/machine/handlerRegistrations";
import { CodeTransform } from "../../../src/api/registration/CodeTransform";
import { InMemoryProject } from "../../../src/api/project/exports";
import * as assert from "assert";

describe("toScalarProjectEditor", () => {

    it("should invoke single transform without parameters", async () => {
        const ct: CodeTransform = async p => p.addFile("foo", "bar");
        const pe = toScalarProjectEditor(ct);
        const p = InMemoryProject.of();
        const r = await pe(p);
        assert(r.edited !== false);
        assert(!!(await p.getFile("foo")));
        assert.strictEqual(await p.totalFileCount(), 1);
    });

    it("should invoke single transform with parameters", async () => {
        const ct: CodeTransform<{name: string}> = async (p, ci) =>
            p.addFile(ci.parameters.name, "bar");
        const pe = toScalarProjectEditor(ct);
        const p = InMemoryProject.of();
        const r = await pe(p, undefined, { name: "tony"});
        assert(r.edited !== false);
        assert(!!(await p.getFile("tony")));
        assert.strictEqual(await p.totalFileCount(), 1);
    });

});
