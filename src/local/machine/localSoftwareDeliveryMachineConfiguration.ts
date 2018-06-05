import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { execSync } from "child_process";
import { allReposInTeam } from "../../api-helper/command/editor/allReposInTeam";
import { createEphemeralProgressLog } from "../../api-helper/log/EphemeralProgressLog";
import { SoftwareDeliveryMachineConfiguration } from "../../api/machine/SoftwareDeliveryMachineOptions";
import { GitHubCredentialsResolver } from "../../handlers/common/GitHubCredentialsResolver";
import { EphemeralLocalArtifactStore } from "../../internal/artifact/local/EphemeralLocalArtifactStore";
import { CachingProjectLoader } from "../../project/CachingProjectLoader";
import { ProjectLoader, ProjectLoadingParameters, WithLoadedProject } from "../../spi/project/ProjectLoader";
import { LocalRepoRefResolver } from "../binding/LocalRepoRefResolver";
import { EnvironmentTokenCredentialsResolver } from "./EnvironmentTokenCredentialsResolver";
import { ProjectPersister } from "@atomist/automation-client/operations/generate/generatorUtils";
import { Success } from "@atomist/automation-client";
import { successOn } from "@atomist/automation-client/action/ActionResult";

export interface LocalSoftwareDeliveryMachineConfiguration extends SoftwareDeliveryMachineConfiguration {

    /**
     * $/<owner>/<repo>
     */
    repositoryOwnerParentDirectory: string;
}

export function localSoftwareDeliveryMachineOptions(repositoryOwnerParentDirectory: string): LocalSoftwareDeliveryMachineConfiguration {
    const repoRefResolver = new LocalRepoRefResolver(repositoryOwnerParentDirectory);
    return {
        sdm: {
            artifactStore: new EphemeralLocalArtifactStore(),
            projectLoader: new MonkeyingProjectLoader(new CachingProjectLoader(), pushToAtomistBranch),
            logFactory: createEphemeralProgressLog,
            credentialsResolver: EnvironmentTokenCredentialsResolver,
            repoRefResolver,
            repoFinder: allReposInTeam(repoRefResolver),
            projectPersister: fileSystemProjectPersister(repositoryOwnerParentDirectory),
        },
        repositoryOwnerParentDirectory,
    };
}

function fileSystemProjectPersister(repositoryOwnerParentDirectory: string): ProjectPersister {
    return async (p, _, id) => {
        console.log("PRETEND TO PERSIST ")
        return successOn(p);
    };
}

class MonkeyingProjectLoader implements ProjectLoader {

    public doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        const action2 = async p => {
            const p2 = await this.monkeyWith(p);
            return action(p2);
        };
        return this.delegate.doWithProject(params, action2);
    }

    constructor(private readonly delegate: ProjectLoader,
                private readonly monkeyWith: (p: GitProject) => Promise<GitProject>) {
    }

}

async function pushToAtomistBranch(p: GitProject): Promise<GitProject> {
    p.push = async opts => {
        await p.createBranch(`atomist/${p.branch}`);
        execSync(`git push --force --set-upstream origin ${p.branch}`, { cwd: p.baseDir});
        return { target: p , success: true };
    };
    return p;
}
