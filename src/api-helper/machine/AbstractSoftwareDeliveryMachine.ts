/*
 * Copyright © 2018 Atomist, Inc.
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

import { HandleCommand, HandleEvent, logger } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import * as _ from "lodash";
import { ListenerRegistrationManagerSupport } from "../../api-helper/machine/ListenerRegistrationManagerSupport";
import { RegistrationManagerSupport } from "../../api-helper/machine/RegistrationManagerSupport";
import { enrichGoalSetters } from "../../api/dsl/goalContribution";
import { ExecuteGoalWithLog } from "../../api/goal/ExecuteGoalWithLog";
import { Goal } from "../../api/goal/Goal";
import { Goals } from "../../api/goal/Goals";
import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import { SoftwareDeliveryMachineConfiguration } from "../../api/machine/SoftwareDeliveryMachineOptions";
import { BuildGoal, JustBuildGoal, StagingEndpointGoal, StagingVerifiedGoal } from "../../api/machine/wellKnownGoals";
import { GoalSetter } from "../../api/mapping/GoalSetter";
import { PushMapping } from "../../api/mapping/PushMapping";
import { PushTest } from "../../api/mapping/PushTest";
import { AnyPush } from "../../api/mapping/support/commonPushTests";
import { PushRule } from "../../api/mapping/support/PushRule";
import { PushRules } from "../../api/mapping/support/PushRules";
import { StaticPushMapping } from "../../api/mapping/support/StaticPushMapping";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";
import { EditorRegistration } from "../../api/registration/EditorRegistration";
import { GeneratorRegistration } from "../../api/registration/GeneratorRegistration";
import { Builder } from "../../spi/build/Builder";
import { Target } from "../../spi/deploy/Target";
import { InterpretLog } from "../../spi/log/InterpretedLog";
import { executeBuild } from "../goal/executeBuild";
import { executeDeploy } from "../goal/executeDeploy";
import { executeUndeploy } from "../goal/executeUndeploy";
import { executeVerifyEndpoint, SdmVerification } from "../listener/executeVerifyEndpoint";
import { lastLinesLogInterpreter } from "../log/logInterpreters";

/**
 * Abstract support class for implementing a SoftwareDeliveryMachine.
 */
export abstract class AbstractSoftwareDeliveryMachine<O extends SoftwareDeliveryMachineConfiguration = SoftwareDeliveryMachineConfiguration>
    extends ListenerRegistrationManagerSupport
    implements SoftwareDeliveryMachine<O> {

    public abstract readonly commandHandlers: Array<Maker<HandleCommand>>;

    public abstract readonly eventHandlers: Array<Maker<HandleEvent<any>>>;

    public readonly extensionPacks: ExtensionPack[] = [];

    protected readonly registrationManager = new RegistrationManagerSupport(this);

    protected readonly disposalGoalSetters: GoalSetter[] = [];

    private pushMap: GoalSetter;

    // Maintained depending on whether this SDM might mutate
    private mightMutate: boolean = false;

    /**
     * Return the PushMapping that will be used on pushes.
     * Useful in testing goal setting.
     * @return {PushMapping<Goals>}
     */
    get pushMapping(): PushMapping<Goals> {
        return this.pushMap;
    }

    /**
     * Return if this SDM purely observes, rather than changes an org.
     * Note that this cannot be 100% reliable, as arbitrary event handlers
     * could be making commits, initiating deployments etc.
     * @return {boolean}
     */
    get observesOnly(): boolean {
        if (this.mightMutate) {
            return false;
        }
        return this.autofixRegistrations.length === 0;
    }

    /*
     * Store all the implementations we know
     */
    public abstract readonly goalFulfillmentMapper;

    /**
     * Provide the implementation for a goal.
     * The SDM will run it as soon as the goal is ready (all preconditions are met).
     * If you provide a PushTest, then the SDM can assign different implementations
     * to the same goal based on the code in the project.
     * @param {string} implementationName
     * @param {Goal} goal
     * @param {ExecuteGoalWithLog} goalExecutor
     * @param options PushTest to narrow matching & InterpretLog that can handle
     * the log from the goalExecutor function
     * @return {this}
     */
    public addGoalImplementation(implementationName: string,
                                 goal: Goal,
                                 goalExecutor: ExecuteGoalWithLog,
                                 options?: Partial<{
                                     pushTest: PushTest,
                                     logInterpreter: InterpretLog,
                                 }>): this {
        const optsToUse = {
            pushTest: AnyPush,
            logInterpreter: lastLinesLogInterpreter(implementationName, 10),
            ...options,
        };
        const implementation = {
            implementationName, goal, goalExecutor,
            pushTest: optsToUse.pushTest,
            logInterpreter: optsToUse.logInterpreter,
        };
        this.goalFulfillmentMapper.addImplementation(implementation);
        return this;
    }

    public addVerifyImplementation(): this {
        const stagingVerification: SdmVerification = {
            verifiers: this.endpointVerificationListeners,
            endpointGoal: StagingEndpointGoal,
            requestApproval: true,
        };
        return this.addGoalImplementation("VerifyInStaging",
            StagingVerifiedGoal,
            executeVerifyEndpoint(stagingVerification, this.configuration.sdm.repoRefResolver));
    }

    public addDisposalRules(...goalSetters: GoalSetter[]): this {
        this.disposalGoalSetters.push(...goalSetters);
        return this;
    }
    public addCommands(...cmds: CommandHandlerRegistration[]): this {
        this.registrationManager.addCommands(...cmds);
        return this;
    }

    public addGenerators(...gens: Array<GeneratorRegistration<any>>): this {
        this.registrationManager.addGenerators(...gens);
        return this;
    }

    public addEditors(...eds: EditorRegistration[]): this {
        this.registrationManager.addEditors(...eds);
        return this;
    }

    public addEditor<P>(ed: EditorRegistration<P>): this {
        this.registrationManager.addEditor<P>(ed);
        return this;
    }

    public addSupportingCommands(...e: Array<Maker<HandleCommand>>): this {
        this.registrationManager.addSupportingCommands(...e);
        return this;
    }

    public addSupportingEvents(...e: Array<Maker<HandleEvent<any>>>): this {
        this.registrationManager.addSupportingEvents(...e);
        return this;
    }

    public addBuildRules(...rules: Array<PushRule<Builder> | Array<PushRule<Builder>>>): this {
        this.mightMutate = rules.length > 0;
        _.flatten(rules).forEach(r =>
            this.addGoalImplementation(r.name, BuildGoal,
                executeBuild(this.configuration.sdm.projectLoader, r.value),
                {
                    pushTest: r.pushTest,
                    logInterpreter: r.value.logInterpreter,
                })
                .addGoalImplementation(r.name, JustBuildGoal,
                    executeBuild(this.configuration.sdm.projectLoader, r.value),
                    {
                        pushTest: r.pushTest,
                        logInterpreter:
                        r.value.logInterpreter,
                    },
                ));
        return this;
    }

    public addDeployRules(...rules: Array<StaticPushMapping<Target> | Array<StaticPushMapping<Target>>>): this {
        this.mightMutate = rules.length > 0;
        _.flatten(rules).forEach(r => {
            // deploy
            this.addGoalImplementation(r.name, r.value.deployGoal, executeDeploy(
                this.configuration.sdm.artifactStore,
                this.configuration.sdm.repoRefResolver,
                r.value.endpointGoal, r.value),
                {
                    pushTest: r.pushTest,
                    logInterpreter: r.value.deployer.logInterpreter,
                },
            );
            // endpoint
            this.addKnownSideEffect(
                r.value.endpointGoal,
                r.value.deployGoal.definition.displayName);
            // undeploy
            this.addGoalImplementation(r.name, r.value.undeployGoal, executeUndeploy(r.value),
                {
                    pushTest: r.pushTest,
                    logInterpreter: r.value.deployer.logInterpreter,
                },
            );
        });
        return this;
    }

    /**
     * Declare that a goal will become successful based on something outside.
     * For instance, ArtifactGoal succeeds because of an ImageLink event.
     * This tells the SDM that it does not need to run anything when this
     * goal becomes ready.
     * @param {Goal} goal
     * @param {string} sideEffectName
     * @param {PushTest} pushTest
     */
    public addKnownSideEffect(goal: Goal, sideEffectName: string,
                              pushTest: PushTest = AnyPush): this {
        this.goalFulfillmentMapper.addSideEffect({
            goal,
            sideEffectName, pushTest,
        });
        return this;
    }

    public addGoalContributions(goalContributions: GoalSetter): this {
        this.pushMap = enrichGoalSetters(this.pushMap, goalContributions);
        return this;
    }

    public addExtensionPacks(...packs: ExtensionPack[]): this {
        for (const configurer of packs) {
            this.addExtensionPack(configurer);
            if (!!configurer.goalContributions) {
                this.addGoalContributions(configurer.goalContributions);
            }
        }
        return this;
    }

    private addExtensionPack(pack: ExtensionPack): this {
        logger.info("Adding extension pack '%s' version %s from %s",
            pack.name, pack.version, pack.vendor);
        pack.configure(this);
        this.extensionPacks.push(pack);
        return this;
    }

    /**
     * Construct a new software delivery machine, with zero or
     * more goal setters.
     * @param {string} name
     * @param configuration automation client configuration we're running in
     * @param {GoalSetter} goalSetters tell me what to do on a push. Hint: start with "whenPushSatisfies(...)"
     */
    protected constructor(public readonly name: string,
                          public readonly configuration: O,
                          goalSetters: Array<GoalSetter | GoalSetter[]>) {
        super();
        this.pushMap = new PushRules("Goal setters", _.flatten(goalSetters));
    }

}
