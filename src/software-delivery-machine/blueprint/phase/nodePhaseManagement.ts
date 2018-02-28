import { logger } from "@atomist/automation-client";
import { PhaseCreationInvocation } from "../../../common/listener/PhaseCreator";
import { Phases } from "../../../common/phases/Phases";
import { npmPhases } from "../../../handlers/events/delivery/phases/npmPhases";

export async function nodePhaseBuilder(pi: PhaseCreationInvocation): Promise<Phases> {
    const p = pi.project;
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
