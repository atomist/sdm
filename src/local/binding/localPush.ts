import { CommandIncoming, EventIncoming } from "@atomist/automation-client/internal/transport/RequestProcessor";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { LoggingProgressLog } from "../../api-helper/log/LoggingProgressLog";
import { SdmContext } from "../../api/context/SdmContext";
import { RunWithLogContext } from "../../api/goal/ExecuteGoalWithLog";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { CoreRepoFieldsAndChannels, OnPushToAnyBranch, StatusForExecuteGoal } from "../../typings/types";
import { LocalHandlerContext } from "./LocalHandlerContext";
import { messageClientAddressChannels } from "../invocation/cli/io/messageClientAddressChannels";
import { HandlerContext } from "@atomist/automation-client";

function repoFields(project: GitProject): CoreRepoFieldsAndChannels.Fragment {
    return {
        owner: project.id.owner,
        name: project.id.repo,
        org: {
            provider: {
                // TODO why do we need this?
                providerType: "github_com" as any,
                apiUrl: "just.not.there",
                url: "and.nor.is.this",
            },
        },
        channels: [],
    };
}

/**
 * Make a push from the last commit to this local git project
 * @param {GitProject} project
 * @return {OnPushToAnyBranch.Push}
 */
async function pushFromLastCommit(project: GitProject): Promise<OnPushToAnyBranch.Push> {
    const status = await project.gitStatus();
    return {
        id: new Date().getTime() + "_",
        branch: project.branch,
        repo: repoFields(project),
        commits: [
            {
                sha: status.sha,
            },
        ],
        after: {
            // TODO take from the commit
            sha: status.sha,
            // TODO message from the commit
        },
    };
}

/**
 * Core invocation fields
 * @return {SdmContext}
 */
function coreInvocation(context: HandlerContext) {
    return {
        context,
        credentials: {token: "ABCD"},
    };
}

export async function localRunWithLogContext(project: GitProject): Promise<RunWithLogContext> {
    const status = await project.gitStatus();
    const commit: StatusForExecuteGoal.Commit = {
        sha: status.sha,
        repo: repoFields(project),
        pushes: [
            await pushFromLastCommit(project),
        ],
    };
    const trigger = {} as EventIncoming;
    const context = new LocalHandlerContext(trigger);
    const id = project.id as any as RemoteRepoRef;
    return {
        id,
        ...coreInvocation(context),
        addressChannels: messageClientAddressChannels(id, context),
        status: {
            commit,
        },
        progressLog: new LoggingProgressLog("name"),
    };
}

/**
 * ProjectLoader that can clone a local project
 * @param {GitProject} p
 * @return {ProjectLoader}
 */
export function cloneLocalProjectProjectLoader(p: GitProject): ProjectLoader {
    return {
        async doWithProject(coords, action) {
            const id = coords.id;
            id.cloneUrl = () => `file://${p.baseDir}`;
            const p1 = await GitCommandGitProject.cloned(coords.credentials, id, {alwaysDeep: true});
            return action(p1);
        },
    };
}
