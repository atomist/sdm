import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { FailDownstreamPhasesOnPhaseFailure } from "../../handlers/events/delivery/FailDownstreamPhasesOnPhaseFailure";
import { Phases } from "../../handlers/events/delivery/Phases";
import { HttpServicePhases, LibraryPhases } from "../../handlers/events/delivery/phases/httpServicePhases";
import {
    ApplyPhasesParameters,
    applyPhasesToCommit,
    SetupPhasesOnPush,
} from "../../handlers/events/delivery/SetupPhasesOnPush";

export const PhaseSetup = () => new SetupPhasesOnPush(scanForPhases);

export const PhaseCleanup = () => new FailDownstreamPhasesOnPhaseFailure(HttpServicePhases);

async function scanForPhases(p: GitProject): Promise<Phases> {
    try {
        const f = await p.findFile("pom.xml");
        const manifest = await p.findFile("manifest.yml").catch(err => undefined);
        const contents = await f.getContent();
        if (contents.includes("spring-boot") && !!manifest) {
            return HttpServicePhases;
        } else {
            return LibraryPhases;
        }
    } catch {
        return undefined;
    }
}

export const applyHttpServicePhases: HandleCommand<ApplyPhasesParameters> =
    commandHandlerFrom(applyPhasesToCommit(HttpServicePhases),
        ApplyPhasesParameters, "ApplyHttpServicePhases",
        "reset phases for an http service",
        "trigger sdm for http service");
