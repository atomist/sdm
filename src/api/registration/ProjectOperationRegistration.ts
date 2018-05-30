import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";

/**
 * Superclass for all registrations of "project operations",
 * which can create or modify projects.
 */
export interface ProjectOperationRegistration<PARAMS> {

    name: string;

    /**
     * Create the editor functions that can modify a project
     * @param {PARAMS} params
     * @return {AnyProjectEditor}
     */
    createEditor: (params: PARAMS) => AnyProjectEditor;
}
