
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";

export interface AutofixRegistration {
    name: string;
    editor: AnyProjectEditor;
}
