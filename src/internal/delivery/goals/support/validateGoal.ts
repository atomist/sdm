import { automationClientInstance } from "@atomist/automation-client";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";

export function isGoalRelevant(sdmGoal: SdmGoal,
                               registration: string = automationClientInstance().configuration.name): boolean {
    // Backwards compatible: we might still have SDMs that don't correctly set the provenance
    if (!sdmGoal.provenance || sdmGoal.provenance.length === 0) {
        return true;
    }
    const provenances = sdmGoal.provenance.sort((p1, p2) => p1.ts - p2.ts);
    return provenances[0].registration === registration;
}