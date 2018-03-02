import { logger } from "@atomist/automation-client";
import { PushTest } from "../PhaseCreator";

export const IsNode: PushTest = async pi => {
    try {
        logger.info("node PushTest on %s:%s", pi.project.id.owner, pi.project.id.repo);
        const f = await pi.project.findFile("package.json");
        const contents = await f.getContent();
        const json = JSON.parse(contents);
        return true;
    } catch {
        return false;
    }
};
