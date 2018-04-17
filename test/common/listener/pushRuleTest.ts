import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { IsLein, LibraryGoals, PushListenerInvocation, whenPushSatisfies } from "../../../src";

describe("Construction of PushRules", () => {

    it("Does not think an empty project is a lein project", async () => {
        const rule = whenPushSatisfies(IsLein)
            .itMeans("Build a Clojure library")
            .setGoals(LibraryGoals);

        const project = InMemoryProject.from({owner: "yes", repo: "no"},
            {path: "package.json", content: "{}"});
        const result = await rule.valueForPush({project} as any as PushListenerInvocation);

        assert(!result);

    });
});