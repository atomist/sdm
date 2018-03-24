import { PushMapping } from "../../common/listener/PushMapping";
import { ProjectListenerInvocation } from "../../common/listener/Listener";
import { PushRule } from "./PushRule";
import * as _ from "lodash";
import { logger } from "@atomist/automation-client";
import { PushChoice } from "../../common/listener/PushChoice";

/**
 * Use to execute a rule set for any push to resolve to an object.
 */
export class PushRules<V> implements PushMapping<V> {

    /**
     * Return all possible values
     * @param {string} name
     * @param {Array<PushRule<V>>} choices
     */
    constructor(public name: string, private choices: Array<PushChoice<V>>) {}

    public get values(): V[] {
        return _.uniq(this.choices.map(rule => rule.value));
    }

    public async test(pi: ProjectListenerInvocation): Promise<V> {
        const goalSetterResults: V[] = await Promise.all(this.choices
            .map(async pc => {
                const relevant = !!pc.guard ? await pc.guard.test(pi) : true;
                if (relevant) {
                    const found = await pc.value;
                    logger.debug("Eligible PushRule with guard [%s] returned goal named %s", pc.guard.name, found);
                    return found;
                } else {
                    logger.debug("Ineligible PushRule with guard [%s] will not be invoked", pc.guard.name);
                    return undefined;
                }
            }));
        const value = goalSetterResults.find(p => !!p);
        logger.info("%s: Value for push on %j is %s", this.name, pi.id, value);
        return value;
    }
}
