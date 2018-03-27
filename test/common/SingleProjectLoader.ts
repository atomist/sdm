import { ProjectLoader, ProjectLoadingParameters, WithLoadedProject } from "../../src/common/repo/ProjectLoader";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Project } from "@atomist/automation-client/project/Project";

export class SingleProjectLoader implements ProjectLoader {

    constructor(private project: Project) {}

    public doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        return action(this.project as GitProject);
    }
}