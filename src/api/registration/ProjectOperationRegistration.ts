import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Superclass for all registrations of "project operations",
 * which can create or modify projects. Either an editor or a createEditor
 * function must be provided.
 */
export interface ProjectOperationRegistration<PARAMS> extends CommandRegistration<PARAMS> {

    /**
     * Editor
     */
    editor?: AnyProjectEditor<PARAMS>;

    /**
     * Create the editor function that can modify a project
     * @param {PARAMS} params
     * @return {AnyProjectEditor}
     */
    createEditor?: (params: PARAMS) => AnyProjectEditor<PARAMS>;
}
