import { setCommandLineLogging } from "../cli/support/consoleOutput";

setCommandLineLogging();

import { logger } from "@atomist/automation-client";
import { sdm } from "../machine";

/**
 * Usage gitHookTrigger <event> <directory>
 */

/* tslint:disable */

export type Event = "postCommit";

const args = process.argv.slice(2);

const event: Event = args[0] as Event;
const baseDir = args[1].replace("/.git/hooks", "");
const branch = args[2];
const sha = args[3];

logger.info("Executing git hook against project at [%s], branch=%s, sha=%s",
    baseDir, branch, sha);

const sdmMethod = sdm[event];
if (!sdmMethod) {
    logger.warn("Unknown git hook event '%s'", event);
}

sdm[event](baseDir, branch, sha);
