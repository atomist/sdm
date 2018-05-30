import { EditorCommandDetails } from "@atomist/automation-client/operations/edit/editorToCommand";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { EmptyParameters } from "../command/support/EmptyParameters";

export interface EditorRegistration<PARAMS = EmptyParameters> extends Partial<EditorCommandDetails> {

    name: string;

    editor: (params: PARAMS) => AnyProjectEditor;

    paramsMaker?: Maker<PARAMS>;

    /**
     * Should this be a dry run editor
     */
    dryRun?: boolean;

}
