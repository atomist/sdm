import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { ChildProcess, spawn } from "child_process";
import { Builder } from "./Builder";

export class MavenBuilder implements Builder {

    public build<P extends LocalProject>(p: P): ChildProcess {
        return spawn("mvn", [
            "package",
            // "-DskipTests",
        ], {
            cwd: p.baseDir,
        });
    }

}
