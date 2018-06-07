import { HandleCommand, HandleEvent, HandlerContext, MappedParameter, MappedParameters, Parameter, Parameters } from "@atomist/automation-client";
import { Arg } from "@atomist/automation-client/internal/invoker/Payload";
import { CommandHandlerMetadata } from "@atomist/automation-client/metadata/automationMetadata";
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
import { FileSystemRemoteRepoRef, isFileSystemRemoteRepoRef } from "../binding/FileSystemRemoteRepoRef";
import { LocalHandlerContext } from "../binding/LocalHandlerContext";
import { localRunWithLogContext } from "../binding/localPush";
import { addGitHooks } from "../setup/addGitHooks";
import { LocalSoftwareDeliveryMachineConfiguration } from "./localSoftwareDeliveryMachineConfiguration";
import { invokeCommandHandlerWithFreshParametersInstance } from "./parameterPopulation";
import { FallbackParams } from "@atomist/automation-client/operations/common/params/FallbackParams";
import { GitHubFallbackReposParameters } from "@atomist/automation-client/operations/common/params/GitHubFallbackReposParameters";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { TargetsParams } from "@atomist/automation-client/operations/common/params/TargetsParams";
import { BitBucketServerRepoRef } from "@atomist/automation-client/operations/common/BitBucketServerRepoRef";
import { GitBranchRegExp } from "@atomist/automation-client/operations/common/params/gitHubPatterns";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

export class LocalSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine<LocalSoftwareDeliveryMachineConfiguration> {

    get commandHandlers(): Array<Maker<HandleCommand>> {
        return this.registrationManager.commandHandlers;
    }

    get eventHandlers(): Array<Maker<HandleEvent<any>>> {
        return this.registrationManager.eventHandlers;
    }

    public readonly goalFulfillmentMapper = new SdmGoalImplementationMapperImpl(undefined);

    /**
     * Install git hooks in all git projects under our local directory
     * @return {Promise<void>}
     */
    public async installGitHooks() {
        const allRepos = await this.configuration.sdm.repoFinder(undefined);
        for (const rr of allRepos) {
            if (!isFileSystemRemoteRepoRef(rr)) {
                throw new Error(`Unexpected return from repo ref resolver: ${JSON.stringify(rr)}`);
            }
            await addGitHooks(rr, rr.fileSystemLocation);
        }
    }

    public async removeGitHooks() {
        throw new Error("Not yet implemented. Looks like Atomist is here to stay");
    }

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

    public addEditors(...eds): this {
        // Transparently change targets so that repos to be edited will default locally
        const edsToUse = eds.map(ed => {
            // Set our own target
            ed.targets = new LocalTargetsParams(this.configuration.repositoryOwnerParentDirectory);
            return ed;
        });
        return super.addEditors(...edsToUse);
    }

// ---------------------------------------------------------------
    // end git binding methods
    // ---------------------------------------------------------------

    public commandMetadata(name: string): CommandHandlerMetadata {
        const handlers = selfDescribingHandlers(this);
        return handlers.filter(h => h.instance.name === name)
            .map(hi => hi.instance)
            .find(() => true);
    }

    public get commandsMetadata(): CommandHandlerMetadata[] {
        return selfDescribingHandlers(this)
            .map(hi => hi.instance);
    }

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
        await invokeCommandHandlerWithFreshParametersInstance(instance,
            handler.instance, parameters, args, context,
            this.configuration.mappedParameterResolver);
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

@Parameters()
export class LocalTargetsParams extends TargetsParams implements FallbackParams {

    @MappedParameter(MappedParameters.GitHubApiUrl, false)
    public apiUrl: string;

    @MappedParameter(MappedParameters.GitHubOwner, false)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository, false)
    public repo: string;

    @Parameter({ description: "Branch or ref. Defaults to 'master'", ...GitBranchRegExp, required: false })
    public sha: string = "master";

    @Parameter({ description: "regex", required: false })
    public repos: string = ".*";

    get credentials(): ProjectOperationCredentials {
        return { token: "this.is.not.your.token.and.does.not.matter" };
    }

    constructor(private readonly repositoryOwnerParentDirectory: string) {
        super();
    }

    /**
     * Return a single RepoRef or undefined if we're not identifying a single repo
     * @return {RepoRef}
     */
    get repoRef(): FileSystemRemoteRepoRef {
        return (!!this.owner && !!this.repo && !this.usesRegex) ?
            new FileSystemRemoteRepoRef(
                this.repositoryOwnerParentDirectory,
                this.owner,
                this.repo,
                "master",
                undefined) :
            undefined;
    }

}
