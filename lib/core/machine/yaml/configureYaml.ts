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

import {
    Configuration,
    deepMergeConfigs,
} from "@atomist/automation-client/lib/configuration";
import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import * as changeCase from "change-case";
import * as fg from "fast-glob";
import * as fs from "fs-extra";
import * as yaml from "js-yaml";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import * as path from "path";
import * as trace from "stack-trace";
import { ExtensionPack } from "../../../api/machine/ExtensionPack";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { SoftwareDeliveryMachineConfiguration } from "../../../api/machine/SoftwareDeliveryMachineOptions";
import { PushTest } from "../../../api/mapping/PushTest";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import { EventHandlerRegistration } from "../../../api/registration/EventHandlerRegistration";
import { githubGoalStatusSupport } from "../../pack/github-goal-status/github";
import { goalStateSupport } from "../../pack/goal-state/goalState";
import { toArray } from "../../util/misc/array";
import {
    configure,
    ConfigureMachineOptions,
    CreateGoals,
    DeliveryGoals,
    GoalConfigurer,
    GoalCreator,
    GoalData,
} from "../configure";
import { decorateSoftwareDeliveryMachine } from "./mapCommand";
import {
    GoalMaker,
    mapGoals,
} from "./mapGoals";
import { PushTestMaker } from "./mapPushTests";
import { mapRules } from "./mapRules";
import {
    camelCase,
    watchPaths,
} from "./util";

export interface YamlSoftwareDeliveryMachineConfiguration {
    extensionPacks?: ExtensionPack[];
}

export type YamlCommandHandlerRegistration =
    Omit<CommandHandlerRegistration, "name" | "paramsMaker" | "parameters">;
export type CommandMaker<PARAMS = NoParameters> =
    (sdm: SoftwareDeliveryMachine) => Promise<YamlCommandHandlerRegistration> | YamlCommandHandlerRegistration;
export type YamlEventHandler<PARAMS = NoParameters> =
    Omit<EventHandlerRegistration<PARAMS>, "name">;
export type EventMaker<PARAMS = NoParameters> =
    (sdm: SoftwareDeliveryMachine) => Promise<YamlEventHandler<PARAMS>> | YamlEventHandler<PARAMS>;

export type ConfigurationMaker = (cfg: Configuration) =>
    Promise<SoftwareDeliveryMachineConfiguration<YamlSoftwareDeliveryMachineConfiguration>> |
    SoftwareDeliveryMachineConfiguration<YamlSoftwareDeliveryMachineConfiguration>;

export enum Target {
    SDM = "sdm",
    Skill = "skill",
}

/**
 * Configuration options for the yaml support
 */
export interface ConfigureYamlOptions<G extends DeliveryGoals> {
    options?: ConfigureMachineOptions;

    tests?: Record<string, PushTest>;

    goals?: GoalCreator<G>;
    configurers?: GoalConfigurer<G> | Array<GoalConfigurer<G>>;

    cwd?: string;

    makers?: {
        commands: Record<string, CommandMaker>,
        events: Record<string, EventMaker>,
        goals: Record<string, GoalMaker>,
        tests: Record<string, PushTestMaker>,
        configurations: Record<string, ConfigurationMaker>,
    };

    patterns?: {
        commands?: string[];
        events?: string[];
        ingesters?: string[];

        goals?: string[];
        tests?: string[];
        configurations?: string[];
    };

    target?: Target;
}

async function createExtensions(cwd: string,
                                options: ConfigureYamlOptions<any>,
                                cfg: YamlSoftwareDeliveryMachineConfiguration,
                                sdm: SoftwareDeliveryMachine): Promise<void> {
    const commandCallback = async (c, k) => {
        let registration: CommandHandlerRegistration;
        try {
            const makerResult = await c(sdm);
            registration = { name: k, ...makerResult };
        } catch (e) {
            e.message = `Failed to make command using CommandMaker ${k}: ${e.message}`;
            throw e;
        }
        try {
            sdm.addCommand(registration);
        } catch (e) {
            e.message = `Failed to add command ${k} '${stringify(registration)}': ${e.message}`;
            throw e;
        }
    };
    if (!options?.makers?.commands) {
        await awaitIterable(await requireCommands(cwd, options?.patterns?.commands), commandCallback);
    } else {
        await awaitIterable(options.makers.commands, commandCallback);
    }

    const eventCallback = async (e, k) => {
        let registration: EventHandlerRegistration;
        try {
            const makerResult = await e(sdm);
            registration = { name: k, ...makerResult };
        } catch (e) {
            e.message = `Failed to make event using EventMaker ${k}: ${e.message}`;
            throw e;
        }
        try {
            sdm.addEvent(registration);
        } catch (e) {
            e.message = `Failed to add event ${k} '${stringify(registration)}': ${e.message}`;
            throw e;
        }
    };
    if (!options.makers?.events) {
        await awaitIterable(await requireEvents(cwd, options?.patterns?.events), eventCallback);
    } else {
        await awaitIterable(options.makers.events, eventCallback);
    }

    await requireIngesters(cwd, options?.patterns?.ingesters);

    sdm.addExtensionPacks(...(sdm.configuration.sdm?.extensionPacks || [
        goalStateSupport({
            cancellation: {
                enabled: true,
            },
        }),
        githubGoalStatusSupport(),
    ]));
}

/**
 * Load one or more yaml files to create goal sets
 *
 * When providing more than one yaml file, files are being loaded
 * in provided order with later files overwriting earlier ones.
 */
export async function configureYaml<G extends DeliveryGoals>(patterns: string | string[],
                                                             options: ConfigureYamlOptions<G> = {}): Promise<Configuration> {
    // Get the caller of this function to determine the cwd for resolving glob patterns
    const callerCallSite = trace.get().filter(t => t.getFileName() !== __filename)
        .filter(t => !!t.getFileName())[0];
    const cwd = options.cwd || path.dirname(callerCallSite.getFileName());

    const cfg = await createConfiguration(cwd, options);

    return configure<G>(async sdm => {
        let sdmToUse = sdm;
        if (options.target === Target.Skill) {
            sdmToUse = decorateSoftwareDeliveryMachine(sdm);
        }
        await createExtensions(cwd, options, cfg, sdmToUse);
        return createGoalData(patterns, cwd, options, cfg, sdmToUse);
    }, options.options || {});
}

async function createConfiguration(cwd: string, options: ConfigureYamlOptions<any>)
    : Promise<YamlSoftwareDeliveryMachineConfiguration> {
    const cfg: any = {};
    if (!options?.makers?.configurations) {
        await awaitIterable(await requireConfiguration(cwd, options?.patterns?.configurations), async v => {
            const c = await v(cfg);
            deepMergeConfigs(cfg, c);
        });
    } else {
        await awaitIterable(options.makers.configurations, async v => {
            const c = await v(cfg);
            deepMergeConfigs(cfg, c);
        });
    }
    _.update(options, "options.preProcessors",
        old => !!old ? old : []);
    options.options.preProcessors = [
        async c => deepMergeConfigs(c, cfg) as any,
        ...toArray(options.options.preProcessors),
    ];
    return cfg;
}

// tslint:disable-next-line:cyclomatic-complexity
async function createGoalData<G extends DeliveryGoals>(patterns: string | string[],
                                                       cwd: string,
                                                       options: ConfigureYamlOptions<G>,
                                                       cfg: YamlSoftwareDeliveryMachineConfiguration,
                                                       sdm: SoftwareDeliveryMachine & { createGoals: CreateGoals<G> })
    : Promise<GoalData> {
    const additionalGoals = options.goals ? await sdm.createGoals(options.goals, options.configurers) : {};
    const goalMakers = !!options.makers?.goals ? options.makers.goals :
        await requireGoals(cwd, _.get(cfg, "extensions.goals"));
    const testMakers = !!options.makers?.tests ? options.makers.tests :
        await requireTests(cwd, _.get(cfg, "extensions.tests"));

    const files = await resolvePaths(cwd, patterns, true);

    const goalData: GoalData = {};

    for (const file of files) {

        const configs = yaml.safeLoadAll(
            await fs.readFile(
                path.join(cwd, file),
                { encoding: "UTF-8" },
            ));

        for (const config of configs) {

            if (!!config.configuration) {
                _.merge(sdm.configuration, camelCase(config.configuration));
            }

            if (!!config.skill) {
                _.merge(sdm.configuration, camelCase(config.skill));

                sdm.configuration.name = config.skill.name;
                (sdm as any).name = config.skill.title || config.skill.name;
            }

            for (const k in config) {
                if (config.hasOwnProperty(k)) {
                    const value = config[k];

                    // Ignore two special keys used to set up the SDM
                    if (k === "name" || k === "configuration" || k === "skill") {
                        continue;
                    }

                    // Just create goals and register with SDM
                    if (k === "goals") {
                        await mapGoals(
                            sdm,
                            camelCase(value),
                            additionalGoals,
                            goalMakers,
                            options.tests || {},
                            testMakers);
                    }

                    if (k === "rules") {
                        await mapRules(value, goalData, sdm, options, additionalGoals, goalMakers, testMakers);
                    }
                }
            }
        }
    }

    return goalData;
}

async function requireExtensions<EXT>(cwd: string,
                                      pattern: string[],
                                      cb: (v: EXT, k: string, e: Record<string, EXT>) => void = () => {
                                      },
): Promise<Record<string, EXT>> {
    if (pattern.length === 0) {
        return {};
    }
    const extensions: Record<string, EXT> = {};
    const files = await resolvePaths(cwd, pattern);
    for (const file of files) {
        const testJs = require(`${cwd}/${file}`);
        _.forEach(testJs, (v: EXT, k: string) => {
            if (!!cb) {
                cb(v, k, extensions);
            }
            extensions[k] = v;
        });
    }
    return extensions;
}

async function requireTests(cwd: string, pattern: string[] = ["tests/**.js", "lib/tests/**.js"])
    : Promise<Record<string, PushTestMaker>> {
    return requireExtensions<PushTestMaker>(cwd, pattern, (v, k, e) => e[changeCase.snake(k)] = v);
}

async function requireGoals(cwd: string, pattern: string[] = ["goals/**.js", "lib/goals/**.js"])
    : Promise<Record<string, GoalMaker>> {
    return requireExtensions<GoalMaker>(cwd, pattern, (v, k, e) => e[changeCase.snake(k)] = v);
}

async function requireCommands(cwd: string, pattern: string[] = ["commands/**.js", "lib/commands/**.js"])
    : Promise<Record<string, CommandMaker>> {
    return requireExtensions<CommandMaker>(cwd, pattern);
}

async function requireEvents(cwd: string, pattern: string[] = ["events/**.js", "lib/events/**.js"])
    : Promise<Record<string, EventMaker>> {
    return requireExtensions<EventMaker>(cwd, pattern);
}

async function requireConfiguration(cwd: string, pattern: string[] = ["config.js", "lib/config.js"])
    : Promise<Record<string, ConfigurationMaker>> {
    return requireExtensions<ConfigurationMaker>(cwd, pattern);
}

async function requireIngesters(cwd: string, pattern: string[] = ["ingesters/**.graphql", "lib/graphql/ingester/**.graphql"])
    : Promise<string[]> {
    const ingesters: string[] = [];
    const files = await resolvePaths(cwd, pattern);
    for (const file of files) {
        ingesters.push((await fs.readFile(file)).toString());
    }
    return ingesters;
}

async function awaitIterable<G>(elems: Record<string, G>, cb: (v: G, k: string) => Promise<any>): Promise<void> {
    for (const k in elems) {
        if (elems.hasOwnProperty(k)) {
            const v = elems[k];
            await cb(v, k);
        }
    }
}

async function resolvePaths(cwd: string, patterns: string | string[], watch: boolean = false): Promise<string[]> {
    const paths = await fg(toArray(patterns), { ignore: [`**/{.git,node_modules}/**`], cwd });
    if (watch) {
        watchPaths(paths);
    }
    return paths;
}
