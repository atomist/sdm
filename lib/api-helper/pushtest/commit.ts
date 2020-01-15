import { PushTest } from "../../api/mapping/PushTest";

/**
 * Push test that tests commit messages for a provided regular expression match
 */
export function hasCommit(test: RegExp): PushTest {
    return {
        name: `hasCommit '${test.source}'`,
        mapping: async pi => {
            return pi.push.commits.some(c => test.test(c.message));
        },
    };
}
