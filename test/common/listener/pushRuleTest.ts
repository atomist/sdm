import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { IsLein, LibraryGoals, PushListenerInvocation, PushRules, whenPushSatisfies } from "../../../src";

describe("Construction of PushRules", () => {

    it("Does not think an empty project is a lein project", async () => {
        const rule = new PushRules("test", [whenPushSatisfies(IsLein)
            .itMeans("Build a Clojure library")
            .setGoals(LibraryGoals)]);

        const project = InMemoryProject.from({owner: "yes", repo: "no"},
            {path: "package.json", content: "{}"});
        const fakePush = {id: "test1"};
        const result = await rule.valueForPush({project, push: fakePush} as any as PushListenerInvocation);

        assert(!result);

    });

    it("Does think a lein project is a lein project", async () => {
        const rule = new PushRules("test", [whenPushSatisfies(IsLein)
            .itMeans("Build a Clojure library")
            .setGoals(LibraryGoals)]);

        const project = InMemoryProject.from({owner: "yes", repo: "no"},
            {path: "project.clj", content: "{}"});
        const fakePush = {id: "ttest2"};
        const result = await rule.valueForPush({project, push: fakePush} as any as PushListenerInvocation);

        assert(result);

    });
});