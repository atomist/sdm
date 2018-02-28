
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";

export async function filesChangedSince(project: GitProject, sha: string): Promise<string[]> {
    const command = `git diff --name-only ${sha}`;
    const cr = await runCommand(command, {cwd: project.baseDir});
    // stdout is nothing but a list of files, one per line
    console.log(cr.stdout);
    return cr.stdout.split("\n")
        .filter(n => !!n);
}
