import "mocha";
import * as assert from "power-assert";
import {renderCommitMessage} from "../src/util/slack/diffRendering";

describe("commit rendering", () => {
    it("can render a commit", () => {

        const text = renderCommitMessage({ owner: "somewhere", name: "over" }, {
            sha: "blue",
            message: "a stripe, it's pretty",
            author: { login: "Dorothy" },
        });

        assert(text.includes("a stripe"));
    });
});
