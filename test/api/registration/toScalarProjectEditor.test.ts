import * as assert from "assert";
import { toScalarProjectEditor } from "../../../src/api-helper/machine/handlerRegistrations";
import { InMemoryProject } from "../../../src/api/project/exports";
import { CodeTransform, CodeTransformOrTransforms } from "../../../src/api/registration/CodeTransform";

describe("toScalarProjectEditor", () => {

    it("should invoke single transform without parameters", async () => {
        const ct: CodeTransform = async p => p.addFile("foo", "bar");
        const pe = toScalarProjectEditor(ct);
        const project = InMemoryProject.of();
        const r = await pe(project);
        assert.notStrictEqual(r.edited, false);
        assert(!!(await project.getFile("foo")));
        assert.strictEqual(await project.totalFileCount(), 1);
    });

    it("should invoke single transform with parameters", async () => {
        const ct: CodeTransform<{ name: string }> = async (p, ci) =>
            p.addFile(ci.parameters.name, "bar");
        const pe = toScalarProjectEditor(ct);
        const project = InMemoryProject.of();
        const r = await pe(project, undefined, { name: "tony" });
        assert.notStrictEqual(r.edited, false);
        assert(!!(await project.getFile("tony")));
        assert.strictEqual(await project.totalFileCount(), 1);
    });

    it("should invoke single transform that doesn't return project", async () => {
        const ct: CodeTransform<{ name: string }> = async (p, ci) => {
            await p.addFile(ci.parameters.name, "bar");
        };
        const pe = toScalarProjectEditor(ct);
        const project = InMemoryProject.of();
        const r = await pe(project, undefined, { name: "tony" });
        assert.notStrictEqual(r.edited, false);
        assert(!!(await project.getFile("tony")));
        assert.strictEqual(await project.totalFileCount(), 1);
    });

    it("should invoke multiple transforms that doesn't return project", async () => {
        const ct: CodeTransformOrTransforms<{ name: string }> = [
            async (p, ci) =>
                p.addFile(ci.parameters.name, "bar"),
            async p =>
                p.addFile("foo", "bar"),
        ];
        const pe = toScalarProjectEditor(ct);
        const project = InMemoryProject.of();
        const r = await pe(project, undefined, { name: "tony" });
        assert.notStrictEqual(r.edited, false);
        assert(!!(await project.getFile("foo")));
        assert(!!(await project.getFile("tony")));
        assert.strictEqual(await project.totalFileCount(), 2);
    });

});
