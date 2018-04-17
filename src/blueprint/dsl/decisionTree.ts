import { PushMapping, PushRules, PushTest } from "../..";

/**
 * Simple DSL to create a decision tree
 * @param {PushTest} givenPushTest
 * @return interim DSL structure
 */
export function given<V>(givenPushTest: PushTest) {
    return {
        itMeans(name: string) {
            return {
                then(...pushMappings: Array<PushMapping<V>>): PushMapping<V> {
                    const rules = new PushRules<V>(name, pushMappings);
                    return {
                        name,
                        valueForPush: async pli => {
                            const eligible = await givenPushTest.valueForPush(pli);
                            return eligible ? rules.valueForPush(pli) : undefined;
                        },
                    };
                },
            };
        },
    };
}
