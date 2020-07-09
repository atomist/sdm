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

import { Project } from "@atomist/automation-client/lib/project/Project";
import { gather } from "@atomist/automation-client/lib/tree/ast/astUtils";
import { FunctionRegistry } from "@atomist/tree-path";
import { XmldocFileParser, XmldocTreeNode } from "../../xml/XmldocFileParser";
import { Dependencies } from "../inspection/findDependencies";
import { Plugin } from "../Plugin";
import { VersionedArtifact } from "../VersionedArtifact";

/**
 * Return dependencies under dependencies section
 */
export async function findDeclaredDependencies(p: Project, glob: string = "pom.xml"): Promise<Dependencies> {
    return findDeclaredDependenciesWith(p, "//project/dependencies/dependency", glob, {});
}

/**
 * Return plugins under plugins section
 */
export async function findDeclaredPlugins(p: Project, glob: string = "pom.xml"): Promise<Plugin[]> {
    return findDeclaredPluginsWith(p, "//project/build/plugins/plugin", glob, {});
}

/**
 * Return plugins under plugin management section
 */
export async function findDeclaredManagedPlugins(p: Project, glob: string = "pom.xml"): Promise<Plugin[]> {
    return findDeclaredPluginsWith(p, "//project/build/pluginManagement/plugins/plugin", glob, {});
}

/**
 * Find declared dependencies using the given path expression.
 * Control over the path expression allows us to look under dependencyManagement,
 * or directly in dependencies section under project
 * @param {Project} p
 * @param {string} pathExpression
 * @param {string} glob
 * @param {FunctionRegistry} functionRegistry
 * @return {Promise<Dependencies>}
 */
async function findDeclaredDependenciesWith(
    p: Project,
    pathExpression: string,
    glob: string = "pom.xml",
    functionRegistry: FunctionRegistry,
): Promise<Dependencies> {
    const dependencies = await gather(p, {
        parseWith: new XmldocFileParser(),
        globPatterns: glob,
        pathExpression,
        mapper: m => {
            return extractVersionedArtifact((m as any) as XmldocTreeNode);
        },
        functionRegistry,
    });
    return { dependencies };
}

/**
 * Find declared plugins using the given path expression.
 * Control over the path expression allows us to look under pluginManagement,
 * or directly in plugin section under project/build
 * @param {Project} p
 * @param {string} pathExpression
 * @param {string} glob
 * @param {FunctionRegistry} functionRegistry
 * @return {Promise<Dependencies>}
 */
async function findDeclaredPluginsWith(
    p: Project,
    pathExpression: string,
    glob: string = "pom.xml",
    functionRegistry: FunctionRegistry,
): Promise<Plugin[]> {
    const plugins = await gather(p, {
        parseWith: new XmldocFileParser(),
        globPatterns: glob,
        pathExpression,
        mapper: m => {
            return extractPlugin((m as any) as XmldocTreeNode);
        },
        functionRegistry,
    });
    return plugins;
}

/*

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>

 */
export function extractVersionedArtifact(n: XmldocTreeNode): VersionedArtifact & { name: string } {
    const groupId = n.$children.find(c => c.$value.startsWith("<groupId>"));
    const artifactId = n.$children.find(c => c.$value.startsWith("<artifactId>"));
    const version = n.$children.find(c => c.$value.startsWith("<version>"));
    const scope = n.$children.find(c => c.$value.startsWith("<scope>"));

    if (!(!!groupId && !!artifactId)) {
        throw new Error(`groupId and artifactId are required in [${n.$value}]`);
    }
    return {
        group: groupId.innerValue,
        artifact: artifactId.innerValue,
        name: artifactId.innerValue,
        version: !!version ? version.innerValue : undefined,
        scope: !!scope ? scope.innerValue : undefined,
    };
}

function extractPlugin(n: XmldocTreeNode): Plugin {
    const groupId = n.$children.find(c => c.$value.startsWith("<groupId>"));
    const artifactId = n.$children.find(c => c.$value.startsWith("<artifactId>"));
    const version = n.$children.find(c => c.$value.startsWith("<version>"));
    const configuration = n.$children.find(c => c.$value.startsWith("<configuration>"));
    const inherited = n.$children.find(c => c.$value.startsWith("<inherited>"));
    const extensions = n.$children.find(c => c.$value.startsWith("<extensions>"));

    // TODO we have cases, like Zipkin, where group is missing
    if (!artifactId) {
        throw new Error(`artifactId is required in [${n.$value}]`);
    }
    return {
        group: groupId ? groupId.innerValue : undefined,
        artifact: artifactId.innerValue,
        version: !!version ? version.innerValue : undefined,
        configuration: !!configuration ? parseConfiguration(configuration.$children) : undefined,
        inherited: !!inherited ? !!inherited.innerValue : undefined,
        extensions: !!extensions ? !!extensions.innerValue : undefined,
    };
}

function parseConfigurationNode(n: XmldocTreeNode): any {
    const configurations: any = {};
    const configurationName = n.$name;
    if (n.$children.length === 0) {
        configurations[configurationName] = n.innerValue;
    } else {
        // TODO need to handle this case
        // const configurationValue = parseConfigurationNode(n);
        // configurations[configurationName] = configurationValue;
    }
    return configurations;
}

function parseConfiguration(nodes: XmldocTreeNode[]): any {
    const configurations: any = {};
    for (const n of nodes) {
        const configurationName = n.$name;
        if (n.$children.length === 0) {
            configurations[configurationName] = n.innerValue;
        } else {
            const configurationValue = parseConfigurationNode(n);
            configurations[configurationName] = configurationValue;
        }
    }
    return configurations;
}
