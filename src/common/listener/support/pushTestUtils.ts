/**
 * All of these guards vote for these phases
 * @param {PushTest} guards
 * @return {PushTest}
 */

import { PushTest } from "../PhaseCreator";

export function allGuardsVoteFor(...guards: PushTest[]): PushTest {
    return async pci => {
        const guardResults: boolean[] = await Promise.all(guards.map(g => g(pci)));
        return !guardResults.some(r => !r);
    };
}