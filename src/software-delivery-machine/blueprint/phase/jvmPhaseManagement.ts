import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { PhaseCreationInvocation, PhaseCreator, PushTest } from "../../../common/listener/PhaseCreator";
import { allGuardsVoteFor } from "../../../common/listener/support/pushTestUtils";
import { Phases } from "../../../common/phases/Phases";
import { SpringBootRestServiceGuard } from "../../../handlers/events/delivery/phase/common/springBootRestServiceGuard";
import { ApplyPhasesParameters, applyPhasesToCommit } from "../../../handlers/events/delivery/phase/SetupPhasesOnPush";
import { HttpServicePhases } from "../../../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../../../handlers/events/delivery/phases/libraryPhases";

export class SpringBootDeployPhaseCreator implements PhaseCreator {

    public guard: PushTest;

    constructor(guard1: PushTest, ...guards: PushTest[]) {
        // As a minimum, it must be a Spring Rest service
        this.guard =  allGuardsVoteFor(SpringBootRestServiceGuard, guard1, ...guards);
    }

    public async createPhases(pi: PhaseCreationInvocation): Promise<Phases | undefined> {
        try {
            const f = await pi.project.findFile("pom.xml");
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
}

export const applyHttpServicePhases: HandleCommand<ApplyPhasesParameters> =
    commandHandlerFrom(applyPhasesToCommit(HttpServicePhases),
        ApplyPhasesParameters, "ApplyHttpServicePhases",
        "reset phases for an http service",
        "trigger sdm for http service");

export class JavaLibraryPhaseCreator implements PhaseCreator {

    public guard = SpringBootRestServiceGuard;

    public async createPhases(pi: PhaseCreationInvocation) {
        try {
            const f = await
            pi.project.findFile("pom.xml");
            return LibraryPhases;
        } catch {
            return undefined;
        }
    }
}
