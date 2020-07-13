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

import { File as ProjectFile } from "@atomist/automation-client/lib/project/File";
import { isLocalProject, LocalProject } from "@atomist/automation-client/lib/project/local/LocalProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import * as _ from "lodash";
import { execPromise } from "../../../../api-helper/misc/child_process";
import { CodeInspection } from "../../../../api/registration/CodeInspectionRegistration";
import { coordinates, VersionedArtifact } from "../VersionedArtifact";

/**
 * Dependencies of a project
 */
export interface Dependencies {
    dependencies: VersionedArtifact[];
}

/**
 * Find dependencies from the effective pom
 * @param {Project} p
 * @return {Promise<VersionedArtifact[]>}
 */
export async function findDependenciesFromEffectivePom(p: Project): Promise<VersionedArtifact[]> {
    if (!(await p.hasFile("pom.xml"))) {
        return [];
    }
    if (!isLocalProject(p)) {
        throw new Error(`Dependency analysis only works on locally cloned projects: had ${p.id.url}`);
    }
    const dependencies = (await extractDependencies(p)).getContentSync().trim();
    const f: string = dependencies.substring(dependencies.indexOf("\n") + 1).replace(/[ ]/gi, "");
    return extractVersionedArtifacts(f);
}

/**
 * Find dependencies from the effective POM
 */
export const FindDependencies: CodeInspection<Dependencies> = async p => {
    return { dependencies: await findDependenciesFromEffectivePom(p) };
};

export const FindDependenciesOfGroup: CodeInspection<Dependencies, { group: string }> = async (p, i) => {
    const deps = await FindDependencies(p, i);
    return {
        dependencies: deps.dependencies.filter(d => d.group === i.parameters.group),
    };
};

/**
 * Return unique dependencies found across all of these projects
 * @param {Dependencies[]} deps
 * @return {Dependencies}
 */
export function uniqueDependencies(deps: Dependencies[]): Dependencies {
    return {
        dependencies: _.uniqBy<VersionedArtifact>(_.flatten(deps.map(d => d.dependencies)), coordinates),
    };
}

const dependenciesFile = "dependencies.txt";

async function extractDependencies(p: LocalProject): Promise<ProjectFile> {
    try {
        await execPromise(`mvn`, [`dependency:list`, `-DoutputFile=${dependenciesFile}`], { cwd: p.baseDir });
        return p.findFile(dependenciesFile);
    } catch (err) {
        throw err;
    }
}

function toVersionArtifact(gav: string[]): VersionedArtifact {
    return {
        group: gav[0],
        artifact: gav[1],
        version: gav[3],
        scope: gav[4],
    };
}

function extractVersionedArtifacts(f: string): VersionedArtifact[] {
    return f
        .split("\n")
        .map(dep => dep.split(":"))
        .map(toVersionArtifact);
}
