
import { PushTest } from "../PhaseCreator";

/**
 * Return the opposite of this push test
 * @param {PushTest} t
 * @return {PushTest}
 */
export function not(t: PushTest): PushTest {
    return async pi => !(await t(pi));
}

/**
 * Return true if all are satisfied
 * @param {PushTest} guards
 * @return {PushTest}
 */
export function allSatisfied(...guards: PushTest[]): PushTest {
    return async pci => {
        const guardResults: boolean[] = await Promise.all(guards.map(g => g(pci)));
        return !guardResults.some(r => !r);
    };
}
