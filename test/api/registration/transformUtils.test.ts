import { InMemoryProject } from "@atomist/automation-client";
import * as assert from "assert";
import { CodeTransform, TransformResult } from "../../../lib/api/registration/CodeTransform";
import { chainTransforms } from "../../../lib/api/registration/transformUtils";

describe("transformUtils", () => {

    it("should chain adds", async () => {
        const t1: CodeTransform = async p => p.addFile("foo", "bar");
        const t2: CodeTransform = async p => p.addFile("fizz", "buzz");
        const chained = chainTransforms(t1, t2);
        const project = InMemoryProject.of();
        const r = await chained(project, undefined, undefined) as TransformResult;
        assert(await project.hasFile("foo"));
        assert(await project.hasFile("fizz"));
        assert.strictEqual(r.edited, undefined);
    });

    it("should note edited", async () => {
        const t1: CodeTransform = async p => p.addFile("foo", "bar");
        const t2: CodeTransform = async p => {
            await p.addFile("fizz", "buzz");
            return { target: p, edited: true, success: true };
        };
        const chained = chainTransforms(t1, t2);
        const project = InMemoryProject.of();
        const r = await chained(project, undefined, undefined) as TransformResult;
        assert(await project.hasFile("foo"));
        assert(await project.hasFile("fizz"));
        assert.strictEqual(r.edited, true);
    });
});
