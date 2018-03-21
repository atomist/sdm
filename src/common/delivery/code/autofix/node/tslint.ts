import { whenPushSatisfies } from "../../../../../blueprint/ruleDsl";
import { asSpawnCommand } from "../../../../../util/misc/spawned";
import { IsNode } from "../../../../listener/support/pushtest/node/nodePushTests";
import { IsTypeScript } from "../../../../listener/support/pushtest/node/tsPushTests";
import { Install } from "../../../build/local/npm/NpmBuilder";
import { LocalCommandAutofix } from "../LocalCommandAutofix";

export const tslintFix = new LocalCommandAutofix("tslint",
    whenPushSatisfies(IsTypeScript, IsNode).itMeans("TypeScript repo"),
    Install,
    asSpawnCommand("npm run lint:fix"));
