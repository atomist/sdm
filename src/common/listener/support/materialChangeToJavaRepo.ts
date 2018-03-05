import { logger } from "@atomist/automation-client";
import { filesChangedSince } from "../../../util/git/filesChangedSince";
import { PushTest } from "../PhaseCreator";

import * as _ from "lodash";

/**
 * Veto if change to deployment unit doesn't seem important enough to
 * build and deploy
 * @param {PhaseCreationInvocation} pci
 * @return {Promise<void>}
 * @constructor
 */
export const MaterialChangeToJavaRepo: PushTest = async pci => {
    const beforeSha = _.get(pci, "push.before.sha");
    if (!beforeSha) {
        logger.info("Cannot determine if change is material on %j: can't find old sha", pci.id);
        return true;
    }
    const changedFiles = await filesChangedSince(pci.project, pci.push.before.sha);
    console.log(`Changed files are [${changedFiles.join(",")}]`);
    if (changedFiles.some(f => f.endsWith(".java")) ||
        changedFiles.some(f => f.endsWith(".html")) ||
        changedFiles.some(f => f.endsWith(".json")) ||
        changedFiles.some(f => f.endsWith(".yml")) ||
        changedFiles.some(f => f.endsWith(".xml"))
    ) {
        logger.info("Change is material on %j: changed files=[%s]", pci.id, changedFiles.join(","));
        return true;
    }
    logger.info("Change is immaterial on %j: changed files=[%s]", pci.id, changedFiles.join(","));
    // await pci.addressChannels(`Sorry. I'm not going to waste electricity on changes to [${changedFiles.join(",")}]`);
    return false;
};
