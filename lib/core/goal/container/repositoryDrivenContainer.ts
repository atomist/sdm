/*
 * Copyright © 2020 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { resolvePlaceholders } from "@atomist/automation-client/lib/configuration";
import * as camelcaseKeys from "camelcase-keys";
import * as yaml from "js-yaml";
import * as _ from "lodash";
import * as os from "os";
import { Goal } from "../../../api/goal/Goal";
import { GoalProjectListenerEvent } from "../../../api/goal/GoalInvocation";
import { DefaultGoalNameGenerator } from "../../../api/goal/GoalNameGenerator";
import { Goals } from "../../../api/goal/Goals";
import {
    FulfillableGoal,
    PlannedGoal,
    PlannedGoals,
} from "../../../api/goal/GoalWithFulfillment";
import { PushListenerInvocation } from "../../../api/listener/PushListener";
import {
    pushTest,
    PushTest,
} from "../../../api/mapping/PushTest";
import { and } from "../../../api/mapping/support/pushTestUtils";
import { DeliveryGoals } from "../../machine/configure";
import { mapTests } from "../../machine/yaml/mapPushTests";
import { toArray } from "../../util/misc/array";
import {
    cachePut,
    cacheRestore,
} from "../cache/goalCaching";
import {
    Container,
    ContainerProgressReporter,
    ContainerRegistration,
    GoalContainer,
    GoalContainerVolume,
} from "./container";
import { executeDockerJob } from "./docker";

export const hasRepositoryGoals: PushTest = pushTest("has SDM goals", async pli => {
    return (await pli.project.getFiles(".atomist/*goals.{yml,yaml}")).length > 0;
});

export function repositoryDrivenContainer(options: { tests?: Record<string, PushTest> } = {}): Goal {
    return new RepositoryDrivenContainer(options.tests || {});
}

export class RepositoryDrivenContainer extends FulfillableGoal {

    constructor(private readonly tests: Record<string, PushTest>) {
        super({ uniqueName: "repository-driven-goal" });

        this.addFulfillment({
            progressReporter: ContainerProgressReporter,
            goalExecutor: async gi => {
                const registration = gi.parameters.registration as ContainerRegistration;

                const c = new Container({ displayName: this.definition.displayName });
                (c as any).register = () => {
                };
                (c as any).addFulfillment = () => c;
                (c as any).addFulfillmentCallback = () => c;
                (c as any).withProjectListener = () => c;
                c.with(registration);

                return executeDockerJob(c, registration)(gi);
            },
            name: DefaultGoalNameGenerator.generateName(`container-docker-${this.definition.displayName}`),
        });

        this.withProjectListener({
            name: "cache-restore",
            events: [GoalProjectListenerEvent.before],
            listener: async (p, gi, e) => {
                const registration = gi.parameters.registration as ContainerRegistration;
                if (registration.input && registration.input.length > 0) {
                    await cacheRestore({ entries: registration.input }).listener(p, gi, e);
                }
            },
        }).withProjectListener({
            name: "cache-put",
            events: [GoalProjectListenerEvent.after],
            listener: async (p, gi, e) => {
                const registration = gi.parameters.registration as ContainerRegistration;
                if (registration.output && registration.output.length > 0) {
                    await cachePut({ entries: registration.output }).listener(p, gi, e);
                }
            },
        });

    }

    public async plan(pli: PushListenerInvocation, goals: Goals): Promise<PlannedGoals> {
        const configYamls = (await pli.project.getFiles(".atomist/*goals.{yml,yaml}"))
            .sort((f1, f2) => f1.path.localeCompare(f2.path));

        const plan: PlannedGoals = {};
        for (const configYaml of configYamls) {
            const configs = yaml.safeLoadAll(await configYaml.getContent());

            for (const config of configs) {

                for (const k in config) {

                    if (config.hasOwnProperty(k)) {
                        const value = config[k];
                        const v = camelcaseKeys(value, { deep: true }) as any;
                        const test = and(...toArray(await mapTests(v.test, this.tests, {})));
                        if (await test.mapping(pli)) {
                            const plannedGoals = toArray(mapGoals(v.goals, {}));
                            plan[k] = {
                                goals: plannedGoals,
                                dependsOn: v.dependsOn,
                            };
                        }
                    }
                }
            }
        }

        await resolvePlaceholders(plan as any, value => resolvePlaceholder(value, pli));

        return plan;
    }
}

function mapGoals(goals: any, additionalGoals: DeliveryGoals): PlannedGoal | PlannedGoal[] {
    if (Array.isArray(goals)) {
        return toArray(goals).map(g => mapGoals(g, additionalGoals)) as PlannedGoal[];
    } else {
        if (!!goals.containers) {
            const name = _.get(goals, "containers.name") || _.get(goals, "containers[0].name");
            return mapPlannedGoal(
                name,
                goals,
                toArray(goals.containers),
                toArray(goals.volumes));
        } else if (!!goals.script) {
            const script = goals.script;
            return mapPlannedGoal(script.name, script, [{
                name: script.name,
                image: script.image || "ubuntu:latest",
                command: script.command,
                args: script.args,
            }], []);
        } else {
            throw new Error(`Unable to construct goal from '${JSON.stringify(goals)}'`);
        }
    }
}

function mapPlannedGoal(name: string, details: any, containers: GoalContainer[], volumes: GoalContainerVolume[]): PlannedGoal {

    const gd = new Goal({ uniqueName: name, displayName: name });
    return {
        details: {
            displayName: gd.definition.displayName,
            descriptions: {
                planned: gd.plannedDescription,
                requested: gd.requestedDescription,
                inProcess: gd.inProcessDescription,
                completed: gd.successDescription,
                failed: gd.failureDescription,
                canceled: gd.canceledDescription,
                stopped: gd.stoppedDescription,
                waitingForApproval: gd.waitingForApprovalDescription,
                waitingForPreApproval: gd.waitingForPreApprovalDescription,
            },
            retry: details.retry,
            preApproval: details.preApproval,
            approval: details.approval,
        },
        parameters: {
            registration: {
                containers,
                volumes,
                input: details.input,
                output: details.output,
            },
        },
    };
}

const PlaceholderExpression = /\$\{([.a-zA-Z_-]+)([.:0-9a-zA-Z-_ \" ]+)*\}/g;

async function resolvePlaceholder(value: string, pli: PushListenerInvocation): Promise<string> {
    if (!PlaceholderExpression.test(value)) {
        return value;
    }
    PlaceholderExpression.lastIndex = 0;
    let currentValue = value;
    let result: RegExpExecArray;
    // tslint:disable-next-line:no-conditional-assignment
    while (result = PlaceholderExpression.exec(currentValue)) {
        const fm = result[0];
        let envValue = _.get(pli, result[1]);
        if (result[1] === "home") {
            envValue = os.userInfo().homedir;
        }
        const defaultValue = result[2] ? result[2].trim().slice(1) : undefined;

        if (envValue) {
            currentValue = currentValue.split(fm).join(envValue);
        } else if (defaultValue) {
            currentValue = currentValue.split(fm).join(defaultValue);
        } else {
            throw new Error(`Placeholder '${result[1]}' can't be resolved`);
        }
        PlaceholderExpression.lastIndex = 0;
    }
    return currentValue;
}
