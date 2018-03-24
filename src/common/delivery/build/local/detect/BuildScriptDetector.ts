
import { SpawnCommand } from "../../../../../util/misc/spawned";
import { ProjectListenerInvocation } from "../../../../listener/Listener";

/**
 * Decide build scripts for a project
 */
export interface BuildScriptDetector {

    scriptsFor(pli: ProjectListenerInvocation): SpawnCommand;
}
