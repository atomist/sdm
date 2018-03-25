import { Project } from "@atomist/automation-client/project/Project";

export interface ProjectIdentification {
    name: string;
}

/**
 * Return identification of this project or undefined if it can't be identified
 */
export type ProjectIdentifier = (p: Project) => Promise<ProjectIdentification | undefined>;
