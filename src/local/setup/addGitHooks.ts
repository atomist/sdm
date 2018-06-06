import { NodeFsLocalProject } from "@atomist/automation-client/project/local/NodeFsLocalProject";
import { FileSystemRemoteRepoRef } from "../binding/FileSystemRemoteRepoRef";
import { logger } from "@atomist/automation-client";
import * as fs from "fs";
import { appendOrCreateFileContent } from "../../util/project/appendOrCreate";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";

const AtomistBase = "/Users/rodjohnson/sforzando-dev/idea-projects/my-flow";

const AtomistHookScriptName = "src/local/atomist-hook.sh";

const AtomistHookScriptPath = `${AtomistBase}/${AtomistHookScriptName}`;

export async function addGitHooks(rr: FileSystemRemoteRepoRef) {
    if (fs.existsSync(`${rr.fileSystemLocation}/.git`)) {
        const p = await NodeFsLocalProject.fromExistingDirectory(rr, rr.fileSystemLocation);
        return addGitHooksToProject(p);
    } else {
        logger.info("addGitHooks: Ignoring directory at %s as it is not a git project",
            rr.fileSystemLocation);
    }
}

export async function addGitHooksToProject(p: LocalProject) {
    // TODO setting executable status should be on the project API
    await appendOrCreateFileContent(
        `\n${AtomistHookScriptPath} postCommit \${PWD}`,
        "/.git/hooks/post-commit")(p);
    fs.chmodSync(`${p.baseDir}/.git/hooks/post-commit`, 0o755);
    logger.info("addGitHooks: Adding git post-commit script to project at %s", p.baseDir);
}
