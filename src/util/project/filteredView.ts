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

import { FileStream, Project } from "@atomist/automation-client/project/Project";

import { File } from "@atomist/automation-client/project/File";
import { AbstractProject } from "@atomist/automation-client/project/support/AbstractProject";
import * as stream from "stream";

/**
 * Create a filtered view of the given project.
 * Changes to the filtered view will affect the source project.
 * @param {LocalProject} p
 * @param filter function to filter file paths
 * @return {Promise<LocalProject>}
 */
export function filteredView<P extends Project = Project>(p: Project,
                                                          filter: (path: string) => boolean): P {
    // Use an ES6 proxy to bring back memories of Spring AOP
    const handler = {
        get: (target, prop) => {
            const decorator = new FilteredProject(target as AbstractProject, filter);
            if (prop.endsWith("Sync")) {
                throw new Error("Don't use sync methods: had " + prop);
            }
            const origMethod = target[prop];
            const decoratedMethod = decorator[prop];
            return function(...args) {
                return !!decoratedMethod ?
                    decoratedMethod.apply(decorator, args) :
                    // tslint:disable-next-line:no-invalid-this
                    origMethod.apply(this, args);
            };
        },
    };
    return new Proxy(p, handler);
}

/**
 * This relies on the implementation of AbstractProject,
 * where overriding streamFilesRaw does move of what we need
 */
class FilteredProject implements Partial<Project> {

    constructor(private readonly project: Project,
                private readonly  filter: (path: string) => boolean) {
    }

    public getFile(path: string): Promise<File | undefined> {
        return this.filter(path) ?
            this.project.getFile(path) :
            undefined;
    }

    public findFile(path: string): Promise<File> {
        if (this.filter(path)) {
            return this.project.findFile(path);
        }
        throw new Error(`No file at ${path}`);
    }

    /**
     * This method is used by most of the others, such as totalFileCount
     * @param {string[]} globPatterns
     * @param {{}} opts
     * @return {FileStream}
     */
    public streamFilesRaw(globPatterns: string[], opts: {}): FileStream {
        const filter = this.filter;
        const onlyIncludedFilters = new stream.Transform({objectMode: true});
        onlyIncludedFilters._transform = function(f, encoding, done) {
            if (filter(f.path)) {
                this.push(f);
            }
            done();
        };
        return this.project.streamFilesRaw(globPatterns, opts)
            .pipe(onlyIncludedFilters);
    }

}
