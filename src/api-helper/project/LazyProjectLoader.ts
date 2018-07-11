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

import { File } from "@atomist/automation-client/project/File";
import { FileStream } from "@atomist/automation-client/project/Project";
import * as stream from "stream";

import { logger } from "@atomist/automation-client";
import { ActionResult } from "@atomist/automation-client/action/ActionResult";
import { GitHubDotComBase, isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitProject, GitPushOptions } from "@atomist/automation-client/project/git/GitProject";
import { GitStatus } from "@atomist/automation-client/project/git/gitStatus";
import { ReleaseFunction } from "@atomist/automation-client/project/local/LocalProject";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { AbstractProject } from "@atomist/automation-client/project/support/AbstractProject";
import { fileContent } from "@atomist/automation-client/util/gitHub";
import { ProjectLoader, ProjectLoadingParameters, WithLoadedProject } from "../../spi/project/ProjectLoader";
import { save } from "./CachingProjectLoader";

/**
 * Create a lazy view of the given project.
 * Changes to the filtered view will affect the source project.
 */
export class LazyProjectLoader implements ProjectLoader {

    constructor(private readonly delegate: ProjectLoader) {
    }

    public doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        const lazyProject = new LazyProject(params.id, this.delegate, params);
        return action(lazyProject);
    }
}

/**
 * Just the methods we can cache
 */
class LazyProject extends AbstractProject implements GitProject {

    private materializedProject: GitProject;

    constructor(id: RemoteRepoRef,
                private readonly delegate: ProjectLoader,
                private readonly params: ProjectLoadingParameters) {
        super(id);
    }

    get materialized(): boolean {
        return !!this.materializedProject;
    }

    get provenance(): string {
        return !!this.materialized ? this.materializedProject.provenance : "unavailable";
    }

    public release: ReleaseFunction = () => undefined;

    get baseDir(): string {
        if (!this.materializedProject) {
            throw new Error("baseDir not supported until materialized");
        }
        return this.materializedProject.baseDir;
    }

    public branch = this.id.branch;
    public newRepo: boolean = false;
    public remote: string = (this.id as RemoteRepoRef).url;

    public async addDirectory(path: string): Promise<this> {
        await this.materializeIfNecessary();
        return this.materializedProject.addDirectory(path) as any;
    }

    public async addFile(path: string, content: string): Promise<this> {
        await this.materializeIfNecessary();
        return this.materializedProject.addFile(path, content) as any;
    }

    public addFileSync(path: string, content: string): void {
        throw new Error("sync methods not supported");
    }

    public async deleteDirectory(path: string): Promise<this> {
        await this.materializeIfNecessary();
        return this.materializedProject.deleteDirectory(path) as any;
    }

    public deleteDirectorySync(path: string): void {
        throw new Error("sync methods not supported");
    }

    public async deleteFile(path: string): Promise<this> {
        await this.materializeIfNecessary();
        return this.materializedProject.deleteFile(path) as any;
    }

    public deleteFileSync(path: string): void {
        throw new Error("sync methods not supported");
    }

    public directoryExistsSync(path: string): boolean {
        throw new Error("sync methods not supported");
    }

    public fileExistsSync(path: string): boolean {
        throw new Error("sync methods not supported");
    }

    public async findFile(path: string): Promise<File> {
        const file = await this.getFile(path);
        if (!file) {
            throw new Error(`No file found: '${path}'`);
        }
        return file;
    }

    public findFileSync(path: string): File {
        throw new Error("sync methods not supported");
    }

    public async getFile(path: string): Promise<File | undefined> {
        if (this.materialized) {
            return this.materializedProject.getFile(path) as any;
        }
        // TODO we need this to work for other gits
        if (isGitHubRepoRef(this.id) && GitHubDotComBase.includes(this.id.apiBase)) {
            logger.info(`Asking github for ${this.id.owner}:${this.id.repo}/${path}`);
            const content = await fileContent(
                (this.params.credentials as TokenCredentials).token,
                this.id.owner,
                this.id.repo,
                path);
            return !!content ? new InMemoryFile(path, content) : undefined;
        }
        return null;
        // await this.materializeIfNecessary();
        // return this.materializedProject.getFile(path) as any;
    }

    public async makeExecutable(path: string): Promise<this> {
        await this.materializeIfNecessary();
        return this.materializedProject.makeExecutable(path) as any;
    }

    public makeExecutableSync(path: string): void {
        throw new Error("sync methods not supported");
    }

    public streamFilesRaw(globPatterns: string[], opts: {}): FileStream {
        const toFileTransform = new stream.Transform({ objectMode: true });

        toFileTransform._transform = function(chunk, encoding, done) {
            // tslint:disable-next-line:no-invalid-this
            this.push(chunk);
            done();
        };
        this.materializeIfNecessary()
            .then(() => {
                const stream = this.materializedProject.streamFilesRaw(globPatterns, opts) as any;
                stream.pipe(toFileTransform);
            });
        return toFileTransform;
    }

    public async checkout(sha: string): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.checkout(sha) as any;
    }

    public async commit(message: string): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.commit(message) as any;
    }

    public async configureFromRemote(): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.configureFromRemote() as any;
    }

    public async createAndSetRemote(gid: RemoteRepoRef, description: string, visibility): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.createAndSetRemote(gid, description, visibility) as any;
    }

    public async createBranch(name: string): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.createBranch(name) as any;
    }

    public async gitStatus(): Promise<GitStatus> {
        await this.materializeIfNecessary();
        return this.materializedProject.gitStatus();
    }

    public async hasBranch(name: string): Promise<boolean> {
        await this.materializeIfNecessary();
        return this.materializedProject.hasBranch(name);
    }

    public async init(): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.init() as any;
    }

    public async isClean(): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.isClean() as any;
    }

    public async push(options?: GitPushOptions): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.configureFromRemote() as any;
    }

    public async raisePullRequest(title: string, body: string): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.raisePullRequest(title, body) as any;
    }

    public async revert(): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.revert() as any;
    }

    public async setRemote(remote: string): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.setRemote(remote) as any;
    }

    public async setUserConfig(user: string, email: string): Promise<ActionResult<this>> {
        await this.materializeIfNecessary();
        return this.materializedProject.setUserConfig(user, email) as any;
    }

    private async materializeIfNecessary() {
        if (!this.materialized) {
            logger.info("Materializing project %j", this.id);
            this.materializedProject = await save(this.delegate, this.params);
        }
    }

}
