import { PushMapping } from "../../../../listener/PushMapping";
import { ProjectListenerInvocation } from "../../../../listener/Listener";
import { Builder } from "../../../../../spi/build/Builder";
import { npmBuilderOptions } from "./npmBuilder";
import { SpawnBuilder } from "../SpawnBuilder";
import { createEphemeralProgressLogWithConsole } from "../../../../log/EphemeralProgressLog";
import { ArtifactStore } from "../../../../../spi/artifact/ArtifactStore";
import { ProjectLoader } from "../../../../repo/ProjectLoader";
import { logger } from "@atomist/automation-client";
import { asSpawnCommand } from "../../../../../util/misc/spawned";

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
        const commands = content.split("\n").map(asSpawnCommand);
        logger.info("Found Atomist build file in project %j: Commands are %j", p.id,
            commands);

        return new SpawnBuilder(this.artifactStore,
            createEphemeralProgressLogWithConsole,
            this.projectLoader, npmBuilderOptions(commands));
    }
}
