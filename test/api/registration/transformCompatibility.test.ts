import { CodeTransform, ExplicitCodeTransform } from "../../../lib/api/registration/CodeTransform";
import * as assert from "assert";

describe("ExplicitTransform", () => {

    it("should be compatible with CodeTransform", () => {
        const ext: ExplicitCodeTransform = async (p, ci, params) => ({ target: p, success: true, edited: false});
        const tr: CodeTransform = ext;
        assert(!!tr);
    });

});
