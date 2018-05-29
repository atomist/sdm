/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {GitProject} from "@atomist/automation-client/project/git/GitProject";
import archiver = require("archiver");
import * as fs from "fs";
import {ReadStream} from "fs";
import {DeployableArtifact} from "../../spi/artifact/ArtifactStore";
import {ProgressLog} from "../../spi/log/ProgressLog";

export class ProjectArchiver {

    constructor(private readonly log: ProgressLog) {
    }

    public async archive(p: GitProject, da: DeployableArtifact): Promise<ReadStream> {
        if (!!da.filename) {
            const archiveFile = `${da.cwd}/${da.filename}`;
            this.log.write(`Using archive ${archiveFile}`);
            return fs.createReadStream(archiveFile);
        } else {
            return new Promise<ReadStream>((resolve, reject) => {
                this.log.write(`Creating archive for directory ${p.baseDir}`);
                // tslint:disable-next-line:no-floating-promises
                this.log.flush();
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
