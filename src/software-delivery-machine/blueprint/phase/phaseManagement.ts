import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { ManifestPath } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import { FailDownstreamPhasesOnPhaseFailure } from "../../../handlers/events/delivery/FailDownstreamPhasesOnPhaseFailure";
import {
    AnyPush,
    ApplyPhasesParameters,
    applyPhasesToCommit, PhaseCreator, PushesToMaster,
    SetupPhasesOnPush,
} from "../../../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../../../handlers/events/delivery/Phases";
import { HttpServicePhases } from "../../../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../../../handlers/events/delivery/phases/libraryPhases";

export const PhaseSetup = () => new SetupPhasesOnPush(
    new PhaseCreator([jvmPhaseBuilder], PushesToMaster),
    new PhaseCreator([buildPhaseBuilder], AnyPush),
);

async function jvmPhaseBuilder(p: GitProject): Promise<Phases> {
    try {
        const f = await p.findFile("pom.xml");
        const manifest = await p.findFile(ManifestPath).catch(err => undefined);
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

async function buildPhaseBuilder(p: GitProject): Promise<Phases> {
    try {
        const f = await p.findFile("pom.xml");
        return LibraryPhases;
    } catch {
        return undefined;
    }
}