import { HandleCommand, HandleEvent, HandlerContext } from "@atomist/automation-client";
import { Arg } from "@atomist/automation-client/internal/invoker/Payload";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";
import { chooseAndSetGoals } from "../../api-helper/goal/chooseAndSetGoals";
import { executeGoal } from "../../api-helper/goal/executeGoal";
import { SdmGoalImplementationMapperImpl } from "../../api-helper/goal/SdmGoalImplementationMapperImpl";
import { constructSdmGoal } from "../../api-helper/goal/storeGoals";
import { createPushImpactListenerInvocation } from "../../api-helper/listener/createPushImpactListenerInvocation";
import { lastLinesLogInterpreter } from "../../api-helper/log/logInterpreters";
import { AbstractSoftwareDeliveryMachine } from "../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { RunWithLogContext } from "../../api/goal/ExecuteGoalWithLog";
import { Goal } from "../../api/goal/Goal";
import { GoalImplementation } from "../../api/goal/support/SdmGoalImplementationMapper";
import { GoalSetter } from "../../api/mapping/GoalSetter";
import { selfDescribingHandlers } from "../../pack/info/support/commandSearch";
import { FileSystemRemoteRepoRef } from "../binding/FileSystemRemoteRepoRef";
import { LocalHandlerContext } from "../binding/LocalHandlerContext";
import { localRunWithLogContext } from "../binding/localPush";
import { LocalSoftwareDeliveryMachineConfiguration } from "./localSoftwareDeliveryMachineConfiguration";
import { invokeCommandHandlerWithFreshParametersInstance } from "./parameterPopulation";

export class LocalSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine<LocalSoftwareDeliveryMachineConfiguration> {

    get commandHandlers(): Array<Maker<HandleCommand>> {
        return this.registrationManager.commandHandlers;
    }

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return this.registrationManager.eventHandlers;
    }

    public readonly goalFulfillmentMapper = new SdmGoalImplementationMapperImpl(undefined);

    // ---------------------------------------------------------------
    // git binding methods
    // ---------------------------------------------------------------
    /**
     * Invoked after post commit. Pretend it's a push
     * @param {string} baseDir
     * @return {Promise<Promise<any>>}
     */
    public async postCommit(baseDir: string, branch: string, sha: string) {
        return this.doWithProjectUnderExpandedDirectoryTree(baseDir, branch, sha,
            async p => {
                const rwlc = await localRunWithLogContext(p);
                const goals = await chooseAndSetGoals(
                    {
                        repoRefResolver: this.configuration.sdm.repoRefResolver,
                        goalsListeners: this.goalsSetListeners,
                        goalSetter: this.pushMapping,
                        projectLoader: this.configuration.sdm.projectLoader,
                        implementationMapping: this.goalFulfillmentMapper,
                    },
                    {
                        credentials: rwlc.credentials,
                        context: rwlc.context,
                        push: rwlc.status.commit.pushes[0],
                    },
                );

                // TODO need to create goal execution graph
                return Promise.all(goals.goals.map(goal =>
                    this.execGoal(p, rwlc, goal)));
            });
    }

    // ---------------------------------------------------------------
    // end git binding methods
    // ---------------------------------------------------------------

    // TODO break dependency on client
    public async executeCommand(name: string, args: Arg[]): Promise<any> {
        const handlers = selfDescribingHandlers(this);
        const handler = handlers.find(h => h.instance.name === name);
        if (!handler) {
            throw new Error(`No command found with name '${name}'`);
        }
        const instance = toFactory(handler.maker)();
        const context: HandlerContext = new LocalHandlerContext(null);
        const parameters = !!instance.freshParametersInstance ? instance.freshParametersInstance() : instance;
        await invokeCommandHandlerWithFreshParametersInstance(instance, handler.instance, parameters, args, context);
    }

    // TODO needs to consider goal state and preconditions
    private async execGoal(project: GitProject,
                           rwlc: RunWithLogContext,
                           goal: Goal) {
        const pli = createPushImpactListenerInvocation(rwlc, project);
        const goalFulfillment: GoalImplementation = await this.goalFulfillmentMapper.findFulfillmentByPush(goal, pli as any) as GoalImplementation;
        if (!goalFulfillment) {
            throw new Error(`Error: No implementation for goal '${goal.uniqueCamelCaseName}'`);
        }
        const sdmGoal = constructSdmGoal(rwlc.context, {
            goal,
            state: "requested",
            fulfillment: goalFulfillment.goalExecutor,
            id: {...rwlc.id, branch: project.branch},
        } as any);
        // const execute = this.goalFulfillmentMapper.findImplementationBySdmGoal(sdmGoal);
        const goalResult = await executeGoal({
                // tslint:disable-next-line:no-invalid-this
                projectLoader: this.configuration.sdm.projectLoader,
            },
            goalFulfillment.goalExecutor,
            rwlc,
            sdmGoal, goal, lastLinesLogInterpreter("thing"));
        if (goalResult.code !== 0) {
            throw new Error(`Code was nonzero`);
        }
    }

    private async doWithProjectUnderExpandedDirectoryTree(baseDir: string,
                                                          branch: string,
                                                          sha: string,
                                                          action: (p: GitProject) => Promise<any>) {
        const p = GitCommandGitProject.fromBaseDir(
            FileSystemRemoteRepoRef.fromDirectory(this.configuration.repositoryOwnerParentDirectory,
                baseDir, branch, sha),
            baseDir,
            {},
            () => null);
        return action(p);
    }

    constructor(name: string,
                configuration: LocalSoftwareDeliveryMachineConfiguration,
                ...goalSetters: Array<GoalSetter | GoalSetter[]>) {
        super(name, configuration, goalSetters);
    }

}
