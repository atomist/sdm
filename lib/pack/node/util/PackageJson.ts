/*
 * Copyright © 2020 Atomist, Inc.
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

/**
 * Typed representation of a package.json file
 */
export interface PackageJson {

    name: string;

    version: string;

    description?: string;

    keywords?: string[];

    homepage?: string;

    bugs?: string | Bugs;

    license?: string;

    author?: string | Author;

    readonly contributors?: string[] | Author[];

    readonly files?: string[];

    readonly main?: string;

    readonly bin?: string | BinMap;

    readonly man?: string | string[];

    readonly directories?: Directories;

    repository?: string | Repository;

    readonly scripts?: ScriptsMap;

    readonly config?: Config;

    readonly dependencies?: DependencyMap;

    readonly devDependencies?: DependencyMap;

    readonly peerDependencies?: DependencyMap;

    readonly optionalDependencies?: DependencyMap;

    readonly bundledDependencies?: string[];

    readonly engines?: Engines;

    readonly os?: string[];

    readonly cpu?: string[];

    readonly preferGlobal?: boolean;

    readonly private?: boolean;

    readonly publishConfig?: PublishConfig;

}

/**
 * An author or contributor
 */
export interface Author {
    name: string;
    email?: string;
    homepage?: string;
}

/**
 * A map of exposed bin commands
 */
export interface BinMap {
    [commandName: string]: string;
}

/**
 * A bugs link
 */
export interface Bugs {
    email?: string;
    url: string;
}

export interface Config {
    name?: string;
    config?: any;
}

/**
 * A map of dependencies
 */
export interface DependencyMap {
    [dependencyName: string]: string;

    /* note: index types */
}

/**
 * CommonJS package structure
 */
export interface Directories {
    lib?: string;
    bin?: string;
    man?: string;
    doc?: string;
    example?: string;
}

export interface Engines {
    node?: string;
    npm?: string;
}

export interface PublishConfig {
    registry?: string;
}

/**
 * A project repository
 */
export interface Repository {
    type: string;
    url: string;
}

export type ScriptsMap = Record<string, string>;
