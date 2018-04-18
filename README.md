# Software Delivery Machine

Atomist framework enabling you to control your delivery and development process in code.

## What is a Software Delivery Machine?
>A **software delivery machine**  (SDM) is a development process in a box. 

It automates all steps in the flow from commit to production (potentially via staging environments), and many other actions, using the consistent model provided by the Atomist *API for software*.

> Many teams have a blueprint in their mind for how they'd like to deliver software and ease their day to day work, but find it hard to realize. A Software Delivery Machine makes it possible.

The concept is explained in detail in Rod Johnson's blog [Why you need a Software Delivery Machine](https://the-composition.com/why-you-need-a-software-delivery-machine-85e8399cdfc0). This [video](https://vimeo.com/260496136) shows it in action.

> Atomist is about developing your development experience by using your coding skills. Change the code, restart, and see your new automations and changed behavior across all your projects, within seconds. 


## Get Started

SDMs based on this framework process events from the Atomist SaaS event hub. The architecture is as follows, with events coming in from the systems that matter in your development process:

<img src="https://atomist.com/img/Atomist-Team-Development.jpg"/>

You'll need to be a member of an Atomist workspace to run one.
Create your own by [enrolling](https://github.com/atomist/welcome/blob/master/enroll.md) at [atomist.com](https://atomist.com).
Things work best if you install an org webhook, so that Atomist receives events for all your GitHub repos.

Once the Atomist bot is in your Slack team, type `@atomist create sdm` to have Atomist create a personalized SDM instance using this project. You can also clone the `sample-sdm` project.

Once your SDM is running, type `@atomist show skills` in any channel to see a list of all available Atomist commands.

## Run Locally

SDM projects are Atomist automation clients, written in [TypeScript](https://www.typescriptlang.org) or JavaScript. See [run an automation client](https://github.com/atomist/welcome/blob/master/runClient.md) for instructions on how to set up your environment and run it under Node.js. 

See [set up](./docs/Setup.md) for additional prerequisites depending on the projects you're building.

See the [sample-sdm project](https://github.com/atomist/sample-sdm) project for instructions on how to run an SDM instance.

## Core Concepts
Atomist is a flexible system, enabling you to build your own automations or use those provided by Atomist or third parties. Because you're using a real programming language (not YAML or Bash), and you have access to a real ecosystem (Node), you can create a rich er delivery experience than you've even imagined.

The SDM framework is based around the goals of a typical delivery
flow (such as code analysis, build and deploy) but is flexible and extensible.

An Atomist SDM can automate important tasks and improve your delivery flow. Specifically:

- Atomist **command handlers** can be used to create services
the right way every time, and help keep them up to date 
- Atomist **event handlers** can drive and improve a custom delivery experience, from commit through 
to deployment and testing

This project demonstrates Atomist as the *API for software*, exposing

- *What we know*: The Atomist cortex, accessible through GraphQL queries and subscription joins
- *What just happened*: An event, triggered by a GraphQL subscription, which is contextualized with the existing knowledge
- *What you're working on*: A library that enables you to comprehend and manipulate the source code you're working on.

This project builds on other Atomist core functionality available from global automations, such as: Atomist **lifecycle**, showing commit, pull request and other activity through actionable messages.

Atomist is not tied to GitHub, but this repository focuses on using Atomist with GitHub.com or
GitHub Enterprise.


### Events
The heart of Atomist is its event handling. As your code flows from commit
through to deployment and beyond, Atomist receives events, correlates the incoming data
with its previous knowledge, and invokes your event handlers with rich context. This enables you to perform tasks such as:

- Scanning code for security or quality issues on every push
- Driving deployments and promotion between environments
- Performing custom actions on deployment, such as kicking off integration test suites.

The Atomist correlated event model also enables Atomist to provide you with visibility throughout the commit to deployment flow, in Slack or through the Atomist web dashboard.

Event handlers subscribe to events using [GraphQL](http://graphql.org) subscriptions. The following example subscribes to completed builds:

```graphql
subscription OnBuildComplete {
  Build {
    buildId
    buildUrl
    compareUrl
    name
    status
    commit {
      sha
      message
      repo {
        name
        owner
        gitHubId
        allowRebaseMerge
        channels {
          name
          id
        }
      }
      statuses {
        context
        description
        state
        targetUrl
      }
    }
  }
}
```
When using TypeScript (our recommended language), an event handler can subscribe to such events with the benefit of strong typing. For example, this Atomist event handler can respond to the above GraphQL subscription:

```typescript
@EventHandler("Set status on build complete",
    GraphQL.subscriptionFromFile("graphql/subscription/OnBuildComplete.graphql"))
export class SetStatusOnBuildComplete implements HandleEvent<OnBuildComplete.Subscription> {

    public async handle(event: EventFired<OnBuildComplete.Subscription>, 
    	ctx: HandlerContext, 
    	params: this): Promise<HandlerResult> {
```

> This repository
> includes event handlers that subscribe to some of the most important events in a typical
> delivery flow. This enables dynamic and sophisticated delivery processes that are consistent across
> multiple projects.

The underlying GraphQL/event handler infrastructure is generic and powerful. This project provides a framework above it that makes typical tasks far easier, while not preventing you from breaking out into lower level functionality. 

### Goals and Listeners

The core SDM functionality relates to what happens on a push to a repository. An SDM allows you to process a push in any way you choose, but typically you want it to initiate a delivery flow.

#### Goals

An SDM allows you to set **goals** on push. Goals correspond to the actions that make up a delivery flow, such as build and deployment. Goals are not necessarily sequential--some may be executed in parallel--but certain goals, such as deployment, have preconditions (goals that must have previously completed successfully).

Goals are set using **rules**, which are typically expressed in a simple internal DSL. For example:

```typescript
whenPushSatisfies(ToDefaultBranch, IsMaven, HasSpringBootApplicationClass, HasCloudFoundryManifest,
    	ToPublicRepo, not(NamedSeedRepo), not(FromAtomist), IsDeployEnabled)
    .itMeans("Spring Boot service to deploy")
    .setGoals(HttpServiceGoals),
whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, not(FromAtomist))
    .itMeans("Spring Boot service local deploy")
    .setGoals(LocalDeploymentGoals),
```

Goals are of the form:

```typescript
export const HttpServiceGoals = new Goals(
    "HTTP Service",
    FingerprintGoal,
    AutofixGoal,
    ReviewGoal,
    CodeReactionGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
    ProductionDeploymentGoal,
    ProductionEndpointGoal);
```

It is possible to define new goals with accompanying implementations, so this approach is highly extensible.

#### Listeners

While goals drive the delivery process, **listeners** help in goal implementation and allow observation of the delivery process. Listener **registrations** allow listeners to be narrowed to being fired on particular pushes. A registratiion includes a name (for diagnostics) and a `PushTest`, narrowing on particular pushes.

For example, the following listener registration causes an automatic fix to be made on every push to a Node project, adding a license file if none is found:

```typescript
 sdm.addAutofixes({
        name: "fix me",
        pushTest: IsNode,
        action: async cri => {
            const license = await axios.get("https://www.apache.org/licenses/LICENSE-2.0.txt");
            return cri.project.addFile("LICENSE", license.data);
        },
    })

```

The following listener observes a build, notifying any linked Slack channels of its status:

```typescript
sdm.addBuildListeners(async br => 
        br.addressChannels(`Build of ${br.id.repo} has status ${br.build.status}`));
```

##### Common Listener Context

All listener invocations receive at least the following generally useful information:

```typescript
export interface RepoListenerInvocation {

    /**
     * The repo this relates to
     */
    id: RemoteRepoRef;

    /**
     * Context of the Atomist EventHandler invocation. Use to run GraphQL
     * queries, use the messageClient directly and find
     * the team and correlation id
     */
    context: HandlerContext;

    /**
     * If available, provides a way to address the channel(s) related to this repo.
     */
    addressChannels?: AddressChannels;

    /**
     * Credentials for use with source control hosts such as GitHub
     */
    credentials: ProjectOperationCredentials;

}
```

##### Available Listener Interfaces
- `ArtifactListener`: Invoked when a new binary has been created
- `BuildListener`: Invoked when a build is complete. 
- `ChannelLinkListenerInvocation`: Invoked when a channel is linked to a repo
- `ClosedIssueListener`: Invoked when an issue is closed
- `CodeReactionListener`: Invoked in response to a code change
- `DeploymentListener`: Invoked when a deployment has succeeded
- `FingerprintDifferenceListener`: Invoked when a fingerprint has changed
- `GoalsSetListener`: Invoked when goals are set on a push
- `Listener`: Superinterface for all listeners
- `NewIssueListener`: Invoked when an issue has been created
- `ProjectListener`: Superinterface for all listeners that relate to a project and make the cloned project available
- `PullRequestListener`: Invoked when a pull request is raised
- `PushListener`: Superinterface for listeners to push events
- `RepoCreationListener`: Invoked when a repository has been created
- `SupersededListener`: Invoked when a commit has been superseded by a subsequent commit
- `TagListener`: Invoked when a repo is created
- `UpdatedIssueListener`: Invoked when an issue has been updated
- `UserJoiningChannelListener`: Invoked when a user joins a channel
- `VerifiedDeploymentListener`: Invoked when an endpoint has been verified


#### Push Mappings
The core event that Atomist reacts to is a push.

The `PushMapping` interface is used consistently to decide how to handle pushes.

```typescript
export interface PushMapping<V> {

    /**
     * Name of the PushMapping. Must be unique
     */
    readonly name: string;

    /**
     * Compute a value for the given push. Return undefined
     * if we don't find a mapped value.
     * Return DoNotSetAnyGoals (null) to shortcut evaluation of the present set of rules,
     * terminating evaluation and guarantee the return of undefined if we've reached this point.
     * Only do so if you are sure
     * that this evaluation must be short circuited if it has reached this point.
     * If a previous rule has matched, it will still be used.
     * The value may be static
     * or computed on demand, depending on the implementation.
     * @param {PushListenerInvocation} p
     * @return {Promise<V | undefined | NeverMatch>}
     */
    valueForPush(p: PushListenerInvocation): Promise<V | undefined | NeverMatch>;
}
```

A `PushTest` is a `PushMapping` that returns boolean.

The DSL


## Code Examples

### Issue Creation
When a new issue is created, you may want to notify people or perform an action.
#### Listener interfaces
`NewIssueListener`: [NewIssueListener](src/common/listener/issueListeners.ts)

#### Examples
The following simple example notifies any user who raises an issue with insufficient detail in the body, via a 
direct message in Slack, and provides them with a helpful
link to the issue. Note that we make use of the
person available via the `openedBy` field:

```typescript
export async function requestDescription(inv: NewIssueInvocation) {
    if (!inv.issue.body || inv.issue.body.length < 10) {
        await inv.context.messageClient.addressUsers(
            `Please add a description for new issue ${inv.issue.number}: _${inv.issue.title}_: ${inv.id.url}/issues/${inv.issue.number}`,
            inv.issue.openedBy.person.chatId.screenName);
    }
}
```
This is registed with a `SoftwareDeliveryMachine` instance as follows:

```typescript
sdm.addNewIssueListeners(requestDescription)
```
Using the `credentials` on the `NewIssueInvocation`, you can even use the GitHub API to modify the issue, for example correcting spelling errors.

### Repo Creation
We frequently want to respond to the creation of a new repository: For example, we may want to notify people, provision infrastructure, or tag it with GitHub topics based on its contents.

#### Listener interfaces
There are two scenarios to consider:

1. The creation of a new repository. `RepoCreationListener`: [RepoCreationListener](src/common/listener/RepoCreationListener.ts)
2. The first push to a repository, which uses the more generic [ProjectListener](src/common/listener/PushListener.ts)

The second scenario is usually more important, as it is possible to create a repository without any source code or a master branch, which isn't enough to work with for common actions.

#### Examples
The following example publishes a message to the `#general` channel in Slack when a new repo has been created:

```typescript
export const PublishNewRepo: SdmListener = (i: ListenerInvocation) => {
    return i.context.messageClient.addressChannels(
        `A new repo was created: \`${i.id.owner}:${i.id.repo}\``, "general");
};

```

Tagging a repo with topics based on its content is a useful action. `tagRepo` is a convenient function to construct a `ProjectListener` for this. It tags as an argument a `Tagger`, which looks at the project content and returns a `Tags` object. The following example from `atomist.config.ts` tags Spring Boot repos, using a `Tagger` from the `spring-automation` project, in addition to suggesting the addition of a Cloud Foundry manifest, and publishing the repo using the listener previously shown:

```typescript
sdm.addNewRepoWithCodeActions(
      tagRepo(springBootTagger),
      suggestAddingCloudFoundryManifest,
      PublishNewRepo)
```

### Push

There are multiple domain-specific listeners associated with pushes.

Most of the listeners use or extend `ProjectListener`, which listens to the following extension of `ListenerInvocation`:

```typescript
/**
 * Invocation for an event relating to a project for which we have source code
 */
export interface ProjectListenerInvocation extends ListenerInvocation {

    /**
     * The project to which this event relates. It will have been cloned
     * prior to this invocation. Modifications made during listener invocation will
     * not be committed back to the project (although they are acceptable if necessary, for
     * example to run particular commands against the project).
     * As well as working with
     * project files using the Project superinterface, we can use git-related
     * functionality fro the GitProject subinterface: For example to check
     * for previous shas.
     * We can also easily run shell commands against the project using its baseDir.
     */
    project: GitProject;

}
```
#### Goal Creation
The first and most important reaction to a push is determining the set of *goals* that will be executed. 
This will drive further behavior: For example, do we need a code review? 
Does a push to this branch trigger a deployment? Typically goal setting depends both on the
 characteristics of the push (usually, its branch), and the characteristics of the project--for example, 
 does it have a Cloud Foundry manifest?

The `GoalSetter` interface is thus a critical determinant of what happens next:

```typescript
export interface GoalSetter {

    /**
     * Test the push as to whether we should even think about creating goals for it.
     * If we return false here, our chooseGoals method will never be
     * called for this push
     */
    readonly guard?: PushTest;

    /**
     * Determine the goals that apply to this commit if the PushTest passes,
     * or return undefined if this GoalSetter doesn't know what to do with it.
     * The latter is not an error.
     * @param {GoalSetterInvocation} pci
     * @return {Promise<Goals>}
     */
    chooseGoals(pci: GoalSetterInvocation): Promise<Goals | undefined>;

}
```
The available interface is:

```typescript
export interface GoalSetterInvocation extends ProjectListenerInvocation {

    readonly push: OnPushToAnyBranch.Push;
}
```
If all `GoalSetter` instances return `undefined` the commit will be tagged as "not material" 
and no further action will be taken.

#### Listener interfaces

##### ProjectReviewer
`ProjectReviewer` is a type defined in `automation-client-ts`. It allows a structured review to be returned. The review comments can localize the file path, line and column if such information is available, and also optionally include a link to a "fix" command to autofix the problem.

The following is a trival project reviewer that always returns a clean report but logs to the console to show when it's invoked:

```typescript
export const logReview: ProjectReviewer = async (p: GitProject,
                                                 ctx: HandlerContext) => {
    console.log("REVIEWING THING");
    return clean(p.id);
};

```

Add in `atomist.config.ts` as follows:

```typescript
sdm.addProjectReviewers(logReview)
    .addProjectReviewers(checkstyleReviewer(checkStylePath));
```
##### CodeReaction interface
This interface allows you to react to the code and changes:

For example, the following function lists changed files to any linked Slack channels for the repo:
```typescript
export async function listChangedFiles(i: CodeReactionInvocation): Promise<any> {
    return i.addressChannels(`Files changed:\n${i.filesChanged.map(n => "- `" + n + "`").join("\n")}`);
}
```
Add in `atomist.config.ts` as follows:

```typescript
sdm.addCodeReactions(listChangedFiles)
```
> If your reaction is essentially a review--for example, it's associated with a known problem in a particular file location--use a ProjectReviewer rather than a CodeReaction.

#### Fingerprints
A special kind of push listener relates to **fingerprints**.

Fingerprints are data computed against a push. Typically they reflect the state of the repository's source code after the push; they can also take into account other characteristics of the commit. Fingerprinting is valuable because:

1. *It enables us to assess the impact of a particular commit, through providing a semantic diff*. For example, did the commit change dependencies? Did it change some particularly sensitive files that necessitate closer than usual review?
2. *It enables us to understand the evolution of a code base over time.* Atomist persists fingerprints, so we can trace over time anything we fingerprint, and report against it. For example, what is happening to code quality metrics over time?

Atomist ships some out of the box fingerprints, such as Maven and `npm` dependency fingerprints. But it's easy to write your own. Fingerprint registrations are like other listener registrations, specifying a name and `PushTest`. The following example is the complete code for fingerprinting dependencies specified in a `package-lock.json` file:

```typescript
export class PackageLockFingerprinter implements FingerprinterRegistration {

    public readonly name = "PackageLockFingerprinter";

    public readonly pushTest: PushTest = IsNode;

    public async action(cri: CodeReactionInvocation): Promise<FingerprinterResult> {
        const lockFile = await cri.project.getFile("package-lock.json");
        if (!lockFile) {
            return [];
        }
        try {
            const content = await lockFile.getContent();
            const json = JSON.parse(content);
            const deps = json.dependencies;
            const dstr = JSON.stringify(deps);
            return {
                name: "dependencies",
                abbreviation: "deps",
                version: "0.1",
                sha: computeShaOf(dstr),
                data: json,
            };
        } catch (err) {
            logger.warn("Unable to compute package-lock.json fingerprint: %s", err.message);
            return [];
        }
    }
}
```
Fingerprinting will only occur if a `FingerprintGoal` is selected when goals are set.

## Generators
Another important concern is project creation. Consistent project creation is important to governance.

Atomist's unique take on project generation starts from a **seed project**--a kind of golden master, that is version controlled using your regular repository hosting solution. A seed project doesn't need to include template content: It's a regular project in whatever stack, and Atomist transforms it to be a unique, custom project based on the parameters supplied at the time of project creation. This allows freedom to evolve the seed project with regular development tools.

Generators can be registered with an SDM as follows:

```typescript
.addGenerators(() => springBootGenerator({
    ...CommonJavaGeneratorConfig,
    seedRepo: "spring-rest-seed",
    intent: "create spring",
}))
```

The `springBootGenerator` function used here is provided in `sample-sdm`, but it's easy enough to write your own. 

You can invoke such a generator from Slack, like this:

<img src="https://github.com/atomist/github-sdm/blob/master/docs/create_sample1.png?raw=true"/>

Note how the repo was automatically tagged with GitHub topics after creation. This was the work of a listener, specified as follows:

```typescript
sdm.addNewRepoWithCodeActions(
    tagRepo(springBootTagger),
);
```

You can then follow along in a linked channel like this:

<img src="https://github.com/atomist/github-sdm/blob/master/docs/sample1_channel.png?raw=true"/>

Note the suggestion to add a Cloud Foundry manifest. This is the work of another listener, which reacts to finding new code in a repo. Listeners and commands such as generators work hand in hand for Atomist.

## Editors
Another core concept is a project **editor**. An editor is a command that transforms project content. Atomist infrastructure can help persist such transformations through branch commits or pull requests, with clean diffs.

### A Simple Editor
Editors use the Atomist `Project` API for simple, testable, access to project contents. They are completely decoupled from the underlying source control system and even from the file system, allowing for straightforward, fast, unit testing.

Here's an example of a simple editor that takes as a parameter the path of a file to remove from a repository. 

```typescript
@Parameters()
export class RemoveFileParams {

    @Parameter()
    public path: string;
}

export const removeFileEditor: HandleCommand = editorCommand<RemoveFileParams>(
    () => removeFile,
    "remove file",
    RemoveFileParams,
    {
        editMode: params => commitToMaster(`You asked me to remove file ${params.path}!`),
    });

async function removeFile(p: Project, ctx: HandlerContext, params: RemoveFileParams) {
    return p.deleteFile(params.path);
}
```

Editors can be registered with an SDM as follows:

```typescript
sdm.addEditors(
    () => removeFileEditor,
);
```

### Dry Run Editors
More elaborate editors use helper APIs on top of the `Project` API such as Atomist's microgrammar API and ANTLR integration.

There's also an important capability of "dry run editing": Performing an edit on a branch, and then either raising either a PR or an issue, depending on build success or failure. This allows us to safely apply edits across many repositories. There's a simple wrapper function to enable this:

```typescript
export const tryToUpgradeSpringBootVersion: HandleCommand = dryRunEditor<UpgradeSpringBootParameters>(
    params => setSpringBootVersionEditor(params.desiredBootVersion),
    UpgradeSpringBootParameters,
    "boot-upgrade", {
        description: `Upgrade Spring Boot version`,
        intent: "try to upgrade Spring Boot",
    },
);
```

<img src="https://github.com/atomist/github-sdm/blob/master/docs/dry_run_upgrade.png?raw=true"/>

Dry run editing is another example of how commands and events can work hand in hand with Atomist to provide a uniquely powerful solution.


## Arbitrary Commands
Both generators and editors are special cases of Atomist **command handlers**, which can be invoked via Slack or HTTP.

## Pulling it All Together: The `SoftwareDeliveryMachine` class

Your ideal delivery blueprint spans delivery flow, generators, editors and other commands. All we need is something to pull it together.

Your event listeners need to be invoked by Atomist handlers. The `SoftwareDeliveryMachine` takes care of this, ensuring that the correct handlers are emitted for use in `atomist.config.ts`, without you needing to worry about the event handler registrations on underlying GraphQL.

The `SoftwareDeliveryMachine` class offers a fluent builder approach to adding command handlers, generators and editors.

### Example
For example:

```typescript
    const sdm = new SoftwareDeliveryMachine(
        {
            builder: K8sBuildOnSuccessStatus,
            deployers: [
                K8sStagingDeployOnSuccessStatus,
                K8sProductionDeployOnSuccessStatus,
            ],
            artifactStore,
        },
        whenPushSatisfies(PushToDefaultBranch, IsMaven, IsSpringBoot, HasK8Spec, PushToPublicRepo)
            .setGoals(HttpServiceGoals),
        whenPushSatisfies(not(PushFromAtomist), IsMaven, IsSpringBoot)
            .setGoals(LocalDeploymentGoals),
        whenPushSatisfies(IsMaven, MaterialChangeToJavaRepo)
            .setGoals(LibraryGoals),
        whenPushSatisfies(IsNode).setGoals(NpmGoals),
    );
    sdm.addNewRepoWithCodeActions(suggestAddingK8sSpec)
        .addSupportingCommands(() => addK8sSpec)
        .addSupportingEvents(() => NoticeK8sTestDeployCompletion,
            () => NoticeK8sProdDeployCompletion)
        .addEndpointVerificationListeners(
            lookFor200OnEndpointRootGet({
                retries: 15,
                maxTimeout: 5000,
                minTimeout: 3000,
            }),
        );
    sdm.addNewIssueListeners(requestDescription)
        .addEditors(() => tryToUpgradeSpringBootVersion)
        .addGenerators(() => springBootGenerator({
            seedOwner: "spring-team",
            seedRepo: "spring-rest-seed",
            groupId: "myco",
        }))
        .addNewRepoWithCodeActions(
            tagRepo(springBootTagger),
            suggestAddingCloudFoundryManifest,
            PublishNewRepo)
        .addProjectReviewers(logReview)
        .addCodeReactions(listChangedFiles)
        .addFingerprinters(mavenFingerprinter)
        .addDeploymentListeners(PostToDeploymentsChannel)
        .addEndpointVerificationListeners(LookFor200OnEndpointRootGet)
        .addVerifiedDeploymentListeners(presentPromotionButton)
        .addSupersededListeners(
            inv => {
                logger.info("Will undeploy application %j", inv.id);
                return LocalMavenDeployer.deployer.undeploy(inv.id);
            })
        .addSupportingCommands(
            () => addCloudFoundryManifest,
            DescribeStagingAndProd,
            () => disposeProjectHandler,
        )
        .addSupportingEvents(OnDryRunBuildComplete);
```
The `SoftwareDeliveryMachine` instance will create the necessary Atomist event handlers to export.

In `atomist.config.ts` you can bring them in simply as follows:

```typescript
commands: assembled.commandHandlers,
events: assembled.eventHandlers,
```

## Structure of This Project

- The `src/spi` directory contains interfaces that are likely to be extended in integrations with infrastructure,
such as artifact storage, logging, build and deployment.
- `src/blueprint` contains the higher level software delivery machine concept that ties things together
- `src/common` contains lower level code
- `src/graphql` contains GraphQL queries. You can add fields to existing queries and subscriptions, and add your own.
- `src/handlers` contains handlers that implement general SDM concepts. This is lower level infrastructure, which you generally won't need to modify directly.
- `src/typings` is where types generated from GraphQL wind up. Refresh these with `npm run gql:gen` 
if you update any GraphQL files in `src/graphql`.
- `src/util` contains miscellaneous utilities.

The important types can be imported into downstream projects from the `index.ts` barrel.

## Plugging in Third Party Tools

This repo shows the use of Atomist to perform many steps itself. However, each of the goals used by Atomist here is pluggable.

It's also easy to integrate third party tools like Checkstyle.

### Integrating CI tools
One of the tools you are most likely to integrate is CI. For example, you can integrate Jenkins, Travis or Circle CI with Atomist so that these tools are responsible for build. This has potential advantages in terms of scheduling and repeatability of environments.

Integrating a CI tool with Atomist is simple. Simply invoke Atomist hooks to send events around build and artifact creation.

If integrating CI tools, we recommend the following:

- CI tools are great for building and generating artifacts. They are often abused as a PaaS for `bash`. If you find your CI usage has you programming in `bash` or YML, consider whether invoking such operations from Atomist event handlers might be a better model.
- Use Atomist generators to create your CI files, and Atomist editors to keep them in synch, minimizing inconsistency.

#### Example: Integrating Travis
tbc

### Integrating APM tools

### Integrating with Static Analysis Tools
Any tool that runs on code, such as Checkstyle, can easily be integrated.

Use shell. node is good for this

## Roadmap

This project is under active development, and still in flux. Some goals:

- Support for BitBucket, as well as GitHub.
