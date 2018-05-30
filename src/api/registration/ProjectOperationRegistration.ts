import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Superclass for all registrations of "project operations",
 * which can create or modify projects.
 */
export interface ProjectOperationRegistration<PARAMS> extends CommandRegistration<PARAMS> {

    /**
     * Create the editor function that can modify a project
     * @param {PARAMS} params
     * @return {AnyProjectEditor}
     */
    createEditor: (params: PARAMS) => AnyProjectEditor;
}
