/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import { ArtifactStore } from "../../../../../spi/artifact/ArtifactStore";
import { Builder } from "../../../../../spi/build/Builder";
import { asSpawnCommand } from "../../../../../util/misc/spawned";
import { ProjectListenerInvocation } from "../../../../listener/Listener";
import { PushMapping } from "../../../../listener/PushMapping";
import { createEphemeralProgressLogWithConsole } from "../../../../log/EphemeralProgressLog";
import { ProjectLoader } from "../../../../repo/ProjectLoader";
import { SpawnBuilder } from "../SpawnBuilder";
import { npmBuilderOptions } from "./npmBuilder";

export const AtomistBuildFile = ".atomist/build.sh";

/**
 * Detect Atomist build file and map to an Npm Build
 */
export class NpmDetectBuildMapping implements PushMapping<Builder> {

    public readonly name = "NpmDetectBuildMapping";

    constructor(private artifactStore: ArtifactStore, private projectLoader: ProjectLoader) {
    }

    public async test(p: ProjectListenerInvocation): Promise<Builder> {
        const buildFile = await p.project.getFile(AtomistBuildFile);
        if (!buildFile) {
            return undefined;
        }
        const content = await buildFile.getContent();
        const commands = content.split("\n")
            .filter(l => !!l)
            .filter(l => !l.startsWith("#"))
            .map(asSpawnCommand);
        logger.info("Found Atomist build file in project %j: Commands are %j", p.id,
            commands);

        return new SpawnBuilder(this.artifactStore,
            createEphemeralProgressLogWithConsole,
            this.projectLoader, npmBuilderOptions(commands));
    }
}
