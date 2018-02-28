import { logger } from "@atomist/automation-client";
import { filesChangedSince } from "../../../../../util/git/filesChangedSince";
import { PushTest } from "../SetupPhasesOnPush";

/**
 * Veto if not important
 * @param {PhaseCreationInvocation} pci
 * @return {Promise<void>}
 * @constructor
 */
export const SpringBootRestServiceGuard: PushTest = async pci => {
    const changedFiles = await filesChangedSince(pci.project, pci.push.before.sha);
    console.log(`Changed files are [${changedFiles.join(",")}]`);
    if (changedFiles.some(f => f.endsWith(".java")) ||
        changedFiles.some(f => f.endsWith(".html")) ||
        changedFiles.some(f => f.endsWith(".xml"))
    ) {
        logger.info("Change is material: changed files=[%s]", changedFiles.join(","));
        return true;
    }
    logger.info("Change is immaterial: changed files=[%s]", changedFiles.join(","));
    // await pci.addressChannels(`Sorry. I'm not going to waste electricity on changes to [${changedFiles.join(",")}]`);
    return false;
};
