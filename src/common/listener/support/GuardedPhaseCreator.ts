import { Phases } from "../../phases/Phases";
import { PhaseCreationInvocation, PhaseCreator, PushTest } from "../PhaseCreator";
import { allSatisfied } from "./pushTestUtils";

/**
 * PhaseCreator wholly driven by one or more PushTest instances.
 * Always returns the same phases
 */
export class GuardedPhaseCreator implements PhaseCreator {

    public guard: PushTest;

    /**
     * Create a PhaseCreator that will always return the same phases if the guards
     * match
     * @param {Phases} phases phases to return if the guards return OK
     * @param {PushTest} guard1
     * @param {PushTest} guards
     */
    constructor(private phases: Phases, guard1: PushTest, ...guards: PushTest[]) {
        this.guard = allSatisfied(guard1, ...guards);
    }

    public async createPhases(pi: PhaseCreationInvocation): Promise<Phases | undefined> {
        return this.phases;
    }
}

/**
 * Simple PhaseCreator DSL
 * @param {PushTest} guard1
 * @param {PushTest} guards
 */
export function whenPushSatisfies(guard1: PushTest, ...guards: PushTest[]): { usePhases(phases: Phases): PhaseCreator } {
    return {
        usePhases(phases) {
            return new GuardedPhaseCreator(phases, guard1, ...guards);
        },
    };
}
