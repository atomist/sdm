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
import { HandlerContext } from "@atomist/automation-client/HandlerContext";
import { toStringArray } from "@atomist/automation-client/internal/util/string";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AutomationEventListenerSupport } from "@atomist/automation-client/server/AutomationEventListener";
import { NoParameters } from "@atomist/automation-client/SmartParameters";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import * as _ from "lodash";
import { ListenerRegistrationManagerSupport } from "../../api-helper/machine/ListenerRegistrationManagerSupport";
import { enrichGoalSetters } from "../../api/dsl/goalContribution";
import { Goal } from "../../api/goal/Goal";
import { ExecuteGoal } from "../../api/goal/GoalInvocation";
import { Goals } from "../../api/goal/Goals";
import { NoProgressReport, ReportProgress } from "../../api/goal/progress/ReportProgress";
import { CommandListenerInvocation } from "../../api/listener/CommandListener";
import { StartupListener, StartupListenerInvocation } from "../../api/listener/StartupListener";
import { validateConfigurationValues } from "../../api/machine/ConfigurationValues";
import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { registrableManager } from "../../api/machine/Registerable";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import { SoftwareDeliveryMachineConfiguration } from "../../api/machine/SoftwareDeliveryMachineOptions";
import { StagingEndpointGoal, StagingVerifiedGoal } from "../../api/machine/wellKnownGoals";
import { GoalSetter } from "../../api/mapping/GoalSetter";
import { PushMapping } from "../../api/mapping/PushMapping";
import { PushTest } from "../../api/mapping/PushTest";
import { AnyPush } from "../../api/mapping/support/commonPushTests";
import { PushRules } from "../../api/mapping/support/PushRules";
import { AutofixRegistration } from "../../api/registration/AutofixRegistration";
import { CodeInspection, CodeInspectionRegistration, CodeInspectionResult } from "../../api/registration/CodeInspectionRegistration";
import { CodeTransformOrTransforms } from "../../api/registration/CodeTransform";
import { CodeTransformRegistration } from "../../api/registration/CodeTransformRegistration";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";
import { EventHandlerRegistration } from "../../api/registration/EventHandlerRegistration";
import { GeneratorRegistration } from "../../api/registration/GeneratorRegistration";
import { GoalApprovalRequestVoter } from "../../api/registration/GoalApprovalRequestVoter";
import { IngesterRegistration } from "../../api/registration/IngesterRegistration";
import { EnforceableProjectInvariantRegistration, InvarianceAssessment } from "../../api/registration/ProjectInvariantRegistration";
import { InterpretLog } from "../../spi/log/InterpretedLog";
import { DefaultGoalImplementationMapper } from "../goal/DefaultGoalImplementationMapper";
import { executeVerifyEndpoint, SdmVerification } from "../listener/executeVerifyEndpoint";
import { lastLinesLogInterpreter } from "../log/logInterpreters";
import { HandlerRegistrationManagerSupport } from "./HandlerRegistrationManagerSupport";
import { toScalarProjectEditor } from "./handlerRegistrations";

/**
 * Abstract support class for implementing a SoftwareDeliveryMachine.
 */
export abstract class AbstractSoftwareDeliveryMachine<O extends SoftwareDeliveryMachineConfiguration = SoftwareDeliveryMachineConfiguration>
    extends ListenerRegistrationManagerSupport
    implements SoftwareDeliveryMachine<O> {

    public abstract readonly commandHandlers: Array<Maker<HandleCommand>>;

    public abstract readonly eventHandlers: Array<Maker<HandleEvent<any>>>;

    public abstract readonly ingesters: string[];

    public readonly extensionPacks: ExtensionPack[] = [];

    protected readonly registrationManager = new HandlerRegistrationManagerSupport(this);

    protected readonly disposalGoalSetters: GoalSetter[] = [];

    protected readonly goalApprovalRequestVoters: GoalApprovalRequestVoter[] = [];

    private pushMap: GoalSetter;

    private fulfillmentMapper;

    public get goalFulfillmentMapper() {
        if (!this.fulfillmentMapper) {
            this.fulfillmentMapper = new DefaultGoalImplementationMapper();
        }
        return this.fulfillmentMapper;
    }

    /**
     * Return the PushMapping that will be used on pushes.
     * Useful in testing goal setting.
     * @return {PushMapping<Goals>}
     */
    get pushMapping(): PushMapping<Goals> {
        return this.pushMap;
    }

    /**
     * Provide the implementation for a goal.
     * The SDM will run it as soon as the goal is ready (all preconditions are met).
     * If you provide a PushTest, then the SDM can assign different implementations
     * to the same goal based on the code in the project.
     * @param {string} implementationName
     * @param {Goal} goal
     * @param {ExecuteGoal} goalExecutor
     * @param options PushTest to narrow matching & InterpretLog that can handle
     * the log from the goalExecutor function
     * @return {this}
     */
    public addGoalImplementation(implementationName: string,
                                 goal: Goal,
                                 goalExecutor: ExecuteGoal,
                                 options?: Partial<{
            pushTest: PushTest,
            logInterpreter: InterpretLog,
            progressReporter: ReportProgress,
        }>): this {
        const implementation = {
            implementationName, goal, goalExecutor,
            pushTest: options && options.pushTest ? options.pushTest :
                AnyPush,
            logInterpreter: options && options.logInterpreter ? options.logInterpreter :
                lastLinesLogInterpreter(implementationName, 10),
            progressReporter: options && options.progressReporter ? options.progressReporter :
                NoProgressReport,
        };
        this.goalFulfillmentMapper.addImplementation(implementation);
        return this;
    }

    public addGoalApprovalRequestVoter(vote: GoalApprovalRequestVoter): this {
        this.goalApprovalRequestVoters.push(vote);
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
            executeVerifyEndpoint(stagingVerification));
    }

    public addEnforceableInvariant<PARAMS>(eir: EnforceableProjectInvariantRegistration<PARAMS>): this {
        const ctr: CodeTransformRegistration = {
            ...eir,
            // Update the name and set an intent
            name: `transform-${eir.name}`,
            intent: !!eir.intent ? toStringArray(eir.intent).map(i => `transform ${i}`) : `transform ${eir.name}`,
        } as CodeTransformRegistration;
        this.addCodeTransformCommand(ctr);
        const afr: AutofixRegistration = {
            ...eir,
            name: `autofix-${eir.name}`,
        } as AutofixRegistration;
        this.addAutofix(afr);
        return this.addCodeInspectionCommand(toCodeInspectionCommand(eir));
    }

    public addDisposalRules(...goalSetters: GoalSetter[]): this {
        this.disposalGoalSetters.push(...goalSetters);
        return this;
    }

    public addCommand<P>(cmd: CommandHandlerRegistration<P>): this {
        this.registrationManager.addCommand(cmd);
        return this;
    }

    public addGeneratorCommand<P = NoParameters>(gen: GeneratorRegistration<P>): this {
        this.registrationManager.addGeneratorCommand(gen);
        return this;
    }

    public addCodeTransformCommand<P>(ed: CodeTransformRegistration<P>): this {
        this.registrationManager.addCodeTransformCommand<P>(ed);
        return this;
    }

    public addCodeInspectionCommand<R, P>(cir: CodeInspectionRegistration<R, P>): this {
        this.registrationManager.addCodeInspectionCommand<R, P>(cir);
        return this;
    }

    public addEvent<T, P>(e: EventHandlerRegistration<T, P>): this {
        this.registrationManager.addEvent<T, P>(e);
        return this;
    }

    public addIngester(i: string | IngesterRegistration): this {
        if (typeof i === "string") {
            this.registrationManager.addIngester({
                ingester: i,
            });
        } else {
            this.registrationManager.addIngester(i);
        }
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
    public addGoalSideEffect(goal: Goal,
                             sideEffectName: string,
                             pushTest: PushTest = AnyPush): this {
        this.goalFulfillmentMapper.addSideEffect({
            goal,
            sideEffectName, pushTest,
        });
        return this;
    }

    public addGoalContributions(goalContributions: GoalSetter): this {
        if (!this.pushMap) {
            logger.info("Setting sole pushMapping '%s'", goalContributions.name);
            this.pushMap = goalContributions;
        } else {
            logger.info("Adding pushMapping '%s' to '%s'", goalContributions.name, this.pushMap.name);
            this.pushMap = enrichGoalSetters(this.pushMap, goalContributions);
        }
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
        validateConfigurationValues(this.configuration, pack);
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
        // If we didn't get any goal setters don't register a mapping
        registrableManager().register(this);
        if (!configuration.listeners) {
            configuration.listeners = [];
        }
        configuration.listeners.push(new InvokeListenersOnStartup(this.startupListeners));

        if (goalSetters.length > 0) {
            this.pushMap = new PushRules("Goal setters", _.flatten(goalSetters));
        }
    }

}

class InvokeListenersOnStartup extends AutomationEventListenerSupport {

    public contextCreated(context: HandlerContext): void {
        const i: StartupListenerInvocation = {
            context,
            addressChannels: async (msg, opts) => context.messageClient.addressChannels(msg, "general", opts),
            credentials: undefined,
        };
        // tslint:disable-next-line:no-floating-promises
        Promise.all(this.startupListeners.map(l => l(i)));
    }

    constructor(private readonly startupListeners: StartupListener[]) {
        super();
    }
}

function toCodeInspectionCommand<PARAMS>(
    eir: EnforceableProjectInvariantRegistration<PARAMS>): CodeInspectionRegistration<InvarianceAssessment, PARAMS> {
    return {
        name: `verify-${eir.name}`,
        intent: !!eir.intent ? toStringArray(eir.intent).map(i => `verify ${i}`) : `verify ${eir.name}`,
        parameters: eir.parameters,
        projectTest: eir.projectTest,
        onInspectionResults: eir.onInspectionResults || defaultOnInspectionResults(eir.name),
        description: eir.description,
        tags: eir.tags,
        targets: eir.targets,
        repoFinder: eir.repoFinder,
        repoFilter: eir.repoFilter,
        repoLoader: eir.repoLoader,
        inspection: eir.inspection || transformToInspection(eir.transform),
    };
}

function defaultOnInspectionResults<PARAMS>(name: string) {
    return async (results: Array<CodeInspectionResult<InvarianceAssessment>>, ci: CommandListenerInvocation<PARAMS>) => {
        const messages = results.map(r =>
            // TODO cast will go with automation-client upgrade
            `${(r.repoId as RemoteRepoRef).url}: Satisfies invariant _${name}_: \`${r.result.holds}\``);
        return ci.addressChannels(messages.join("\n"));
    };
}

/**
 * Return a AutoCodeInspection that runs a transform and sees whether or it made
 * an edit
 * @param {CodeTransformOrTransforms<PARAMS>} transform
 * @return {CodeInspection<InvarianceAssessment, PARAMS>}
 */
function transformToInspection<PARAMS>(transform: CodeTransformOrTransforms<PARAMS>): CodeInspection<InvarianceAssessment, PARAMS> {
    const editor = toScalarProjectEditor(transform);
    return async (p, i) => {
        const result = await editor(p, i.context, i.parameters);
        return {
            id: p.id as RemoteRepoRef,
            holds: !result.edited,
            details: `Transform result edited returned ${result.edited}`,
        };
    };
}
