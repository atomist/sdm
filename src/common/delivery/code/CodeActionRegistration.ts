
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { PushTest } from "../../listener/GoalSetter";

export interface CodeActionRegistration<T> {

    pushTest: PushTest;
    action: T;
}

export interface AutofixRegistration extends CodeActionRegistration<AnyProjectEditor> {
    name: string;
}
