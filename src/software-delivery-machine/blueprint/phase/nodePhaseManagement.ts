import { logger } from "@atomist/automation-client";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { ManifestPath } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import { Phases } from "../../../handlers/events/delivery/Phases";
import { npmPhases } from "../../../handlers/events/delivery/phases/npmPhases";

export async function nodePhaseBuilder(p: GitProject): Promise<Phases> {
    try {
        logger.info("node phase builder on %s:%s", p.id.owner, p.id.repo);
        const f = await p.findFile("package.json");
        const contents = await f.getContent();
        const json = JSON.parse(contents);
        return npmPhases;
    } catch {
        return undefined;
    }
}
