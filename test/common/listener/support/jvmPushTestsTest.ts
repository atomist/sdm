import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import "mocha";
import * as assert from "power-assert";
import { PushTestInvocation } from "../../../../src/common/listener/GoalSetter";
import { IsJava, IsMaven } from "../../../../src/common/listener/support/jvmPushTests";

describe("jvmPushTests", () => {

    describe("IsMaven", () => {

        it("should not find maven in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await IsMaven({project} as any as PushTestInvocation);
            assert(!r);
        });

        it("should find maven in repo with named pom", async () => {
            const project = InMemoryProject.of({ path: "pom.xml", content: "<xml>"});
            const r = await IsMaven({project} as any as PushTestInvocation);
            assert(r);
        });
    });

    describe("IsJava", () => {

        it("should not find Java in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await IsJava({project} as any as PushTestInvocation);
            assert(!r);
        });

        it("should find Java in repo with Java file", async () => {
            const project = InMemoryProject.of({ path: "src/main/java/Thing.java", content: "public class Thing {}"});
            const r = await IsJava({project} as any as PushTestInvocation);
            assert(r);
        });

        it("should not find Java in repo with no Java file", async () => {
            const project = InMemoryProject.of({ path: "src/main/java/Thing.kt", content: "public class Thing {}"});
            const r = await IsJava({project} as any as PushTestInvocation);
            assert(!r);
        });
    });

});
