
import { PushRule } from "../../../../../blueprint/support/PushRule";
import { SpawnCommand } from "../../../../../util/misc/spawned";
import { ProjectListenerInvocation } from "../../../../listener/Listener";
import { BuildScriptDetector } from "./BuildScriptDetector";

export class RuleBasedBuildScriptDetector implements BuildScriptDetector {

    private rules: PushRule<SpawnCommand>;

    public scriptsFor(pli: ProjectListenerInvocation): SpawnCommand {
        return null;
    }
}
