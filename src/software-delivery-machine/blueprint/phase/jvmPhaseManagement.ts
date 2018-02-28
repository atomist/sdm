import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { SpringBootRestServiceGuard } from "../../../handlers/events/delivery/phase/common/springBootRestServiceGuard";
import {
    allGuardsVoteFor,
    ApplyPhasesParameters,
    applyPhasesToCommit,
    PhaseCreationInvocation,
    PushesToMaster,
} from "../../../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../../../handlers/events/delivery/Phases";
import { HttpServicePhases } from "../../../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../../../handlers/events/delivery/phases/libraryPhases";

export async function jvmPhaseBuilder(pi: PhaseCreationInvocation): Promise<Phases> {
    const relevant: boolean = await allGuardsVoteFor(SpringBootRestServiceGuard, PushesToMaster)(pi);
    if (!relevant) {
        return undefined;
    }

    try {
        const f = await pi.project.findFile("pom.xml");
        // TODO: how can we distinguish a lib from a service that should run in k8s?
        // const manifest = await p.findFile(ManifestPath).catch(err => undefined); // this is PCF-specific
        const contents = await f.getContent();
        if (contents.includes("spring-boot") /* && !!manifest */) {
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

export async function buildPhaseBuilder(pi: PhaseCreationInvocation): Promise<Phases> {
    const relevant: boolean = await SpringBootRestServiceGuard(pi);
    if (!relevant) {
        return undefined;
    }
    try {
        const f = await pi.project.findFile("pom.xml");
        return LibraryPhases;
    } catch {
        return undefined;
    }
}
