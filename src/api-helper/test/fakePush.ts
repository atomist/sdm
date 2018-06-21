import { PushListenerInvocation } from "../../api/listener/PushListener";
import { Project } from "@atomist/automation-client/project/Project";
import { fakeContext } from "./fakeContext";

export function fakePush(project?: Project): PushListenerInvocation {
    return {
        push: {id: new Date().getTime() + "_"},
        project,
        context: fakeContext(),
    } as any as PushListenerInvocation;
}