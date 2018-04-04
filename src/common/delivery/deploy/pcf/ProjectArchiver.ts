import {GitProject} from "@atomist/automation-client/project/git/GitProject";
import archiver = require("archiver");
import * as fs from "fs";
import {ReadStream} from "fs";
import {DeployableArtifact} from "../../../../spi/artifact/ArtifactStore";
import {ProgressLog} from "../../../../spi/log/ProgressLog";

export class ProjectArchiver {

    constructor(private log: ProgressLog) {
    }

    public async archive(p: GitProject, da: DeployableArtifact): Promise<ReadStream> {
        if (!!da.filename) {
            const archiveFile = `${da.cwd}/${da.filename}`;
            this.log.write(`Using archive ${archiveFile}`);
            return fs.createReadStream(archiveFile);
        } else {
            return new Promise<ReadStream>((resolve, reject) => {
                this.log.write(`Creating archive for directory ${p.baseDir}`);
                const packageFilePath = p.baseDir + "/cfpackage.zip";
                const output = fs.createWriteStream(packageFilePath);
                output.on("close", () => {
                    this.log.write(`Created project archive ${packageFilePath}`);
                    const packageFile = fs.createReadStream(packageFilePath);
                    return resolve(packageFile);
                });
                const archive = archiver("zip", {
                    store: true,
                });
                archive.pipe(output);
                archive.directory(p.baseDir, false);
                archive.on("error", err => {
                    reject(err);
                });
                archive.finalize();
            });
        }
    }
}
