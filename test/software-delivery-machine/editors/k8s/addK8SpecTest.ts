
import "mocha";

import { HandlerContext } from "@atomist/automation-client";
import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import {
    addK8sSpecEditor,
    AtomistK8sSpecFile,
} from "../../../../src/software-delivery-machine/commands/editors/k8s/addK8sSpec";

describe("addK8SpecEditor", () => {

    it("should add a file", async () => {
        const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
            {path: "something", content: "with content"});
        await addK8sSpecEditor(p, { teamId: "anything"} as HandlerContext);
        assert(p.fileExistsSync(AtomistK8sSpecFile), "Should have spec file");
        const content = p.findFileSync(AtomistK8sSpecFile).getContentSync();
        assert(JSON.parse(content), "Should be valid JSON");
        assert(content.includes("\n"), "Should be properly formatted");
    });

});
