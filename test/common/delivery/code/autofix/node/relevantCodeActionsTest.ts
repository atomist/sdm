import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import axios from "axios";
import "mocha";
import * as assert from "power-assert";
import { tslintFix } from "../../../../../../src/common/delivery/code/autofix/node/tslint";
import { AutofixRegistration, relevantCodeActions } from "../../../../../../src/common/delivery/code/codeActionRegistrations";
import { PushTestInvocation } from "../../../../../../src/common/listener/PushTest";

describe("relevantCodeActions", () => {

    it("should match action without push test", async () => {
        const pti: PushTestInvocation = null;
        const autofixes: AutofixRegistration = {
            name: "License Fix",
            action: async p => {
                const license = await axios.get("https://www.apache.org/licenses/LICENSE-2.0.txt");
                return p.addFile("LICENSE", license.data);
            },
        };
        const relevant = await relevantCodeActions([autofixes], pti);
        assert.equal(relevant.length, 1);
    });

    it("should ignore irrelevant", async () => {
        const pti: PushTestInvocation = {
            project: new InMemoryProject(),
        } as any as PushTestInvocation;
        const relevant = await relevantCodeActions([tslintFix], pti);
        assert.equal(relevant.length, 0);
    });

});
