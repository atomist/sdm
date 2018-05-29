# Software Delivery Machine

Atomist framework enabling you to control your delivery and development process in code. Think of it as Spring Boot for software delivery.

## What is a Software Delivery Machine?
A **software delivery machine**  (SDM) is a development process in a box. It automates all steps in the flow from commit to production (potentially via staging environments), and many other actions, using the consistent model provided by the Atomist *API for software*.

> Many teams have a blueprint in their mind for how they'd like to deliver software and ease their day to day work, but find it hard to realize. A Software Delivery Machine makes it possible.

The concept is explained in detail in Rod Johnson's blog [Why you need a Software Delivery Machine](https://the-composition.com/why-you-need-a-software-delivery-machine-85e8399cdfc0). This [video](https://vimeo.com/260496136) shows it in action.

> Atomist is about developing your development experience by using your coding skills. Change the code, restart, and see your new automations and changed behavior across all your projects, within seconds. 

## Get Started
This repository contains an SDM framework built on lower level Atomist capabilities.

SDMs based on this framework process events from the Atomist SaaS event hub. The architecture is as follows, with events coming in from the systems that matter in your development process:

<img src="https://atomist.com/img/Atomist-Team-Development.jpg"/>

You'll need to be a member of an Atomist workspace to run an SDM.
Create your own by [enrolling](https://github.com/atomist/welcome/blob/master/enroll.md) at [atomist.com](https://atomist.com).
Things work best if you install an org webhook, so that Atomist receives events for all your GitHub repos.

Once the Atomist bot is in your Slack team, type `@atomist create sdm` to have Atomist create a personalized SDM instance using this project. You can also clone the `sample-sdm` project.

Once your SDM is running, type `@atomist show skills` in any channel to see a list of all available Atomist commands.

## Run Locally

SDM projects are Atomist automation clients, written in [TypeScript](https://www.typescriptlang.org) or JavaScript. See [run an automation client](https://github.com/atomist/welcome/blob/master/runClient.md) for instructions on how to set up your environment and run it under Node.js. 

See [set up](./docs/Setup.md) for additional prerequisites depending on the projects you're building.

See the [sample-sdm project](https://github.com/atomist/sample-sdm) project for instructions on how to run an SDM instance, and description of the out of the box functionality.

## Core Concepts
Atomist is a flexible platform, enabling you to build your own automations or use those provided by Atomist or third parties. Because you're using a real programming language (not YAML or Bash), and you have access to a real ecosystem (Node), you can create a richer delivery experience than you've even imagined.

This project demonstrates Atomist as the *API for software*, exposing:

- *What we know*: The Atomist cortex, accessible through GraphQL queries and subscription joins
- *What just happened*: An event, triggered by a GraphQL subscription, which is contextualized with the existing knowledge
- *What you're working on*: A library that enables you to comprehend and manipulate the source code you're working on.

This project builds on other Atomist core functionality available from global automations, such as: Atomist **lifecycle**, showing commit, pull request and other activity through actionable messages.

Atomist is not tied to GitHub, but this repository focuses on using Atomist with GitHub.com or
GitHub Enterprise.


### Events
The heart of Atomist is its event handling. As your code flows from commit
through to deployment and beyond, Atomist receives events, correlates the incoming data
with its previous knowledge, and invokes your event handlers with rich context. This enables your automations to perform tasks such as:

- Scanning code for security or quality issues on every push
- Driving deployments and promotion between environments
- Performing custom actions on deployment, such as kicking off integration test suites.

The Atomist correlated event model also enables Atomist to provide you with visibility throughout the commit to deployment flow, in Slack or through the Atomist web dashboard.

#### Under the Hood: How it Works
Event handlers subscribe to events using [GraphQL](http://graphql.org) subscriptions against the Atomist cortex. The following GraphQL subscribes to completed builds, returning related data such as the last commit and any linked Slack channels:

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

This underlying GraphQL/event handler infrastructure is generic and powerful. However, many things are better done at a higher level. This project provides a framework above this infrastructure that makes typical tasks far easier, while not preventing you from breaking out into lower level functionality. 

> This repository
> includes event handlers that subscribe to the most important events in a typical
> delivery flow. This enables dynamic and sophisticated delivery processes that are consistent across
> multiple projects.

### Goals and Listeners

The most important higher level SDM functionality relates to what happens on a push to a repository. An SDM allows you to process a push in any way you choose, but typically you want it to initiate a delivery flow.

#### Goals

An SDM allows you to set **goals** on push. Goals correspond to the actions that make up a delivery flow, such as build and deployment. Goals are not necessarily sequential--some may be executed in parallel--but certain goals, such as deployment, have preconditions (goals that must have previously completed successfully).

Goals are set using **rules**, which are typically expressed in a simple internal DSL. For example, the following rules use `PushTest` predicates such as `ToDefaultBranch` and `IsMaven` to determine what goals to set for incoming pushes:

```typescript
whenPushSatisfies(ToDefaultBranch, IsMaven, HasSpringBootApplicationClass, HasCloudFoundryManifest,
    	ToPublicRepo, not(NamedSeedRepo), not(FromAtomist), IsDeployEnabled)
    .setGoals(HttpServiceGoals),
whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, not(FromAtomist))
    .itMeans("Spring Boot service local deploy")
    .setGoals(LocalDeploymentGoals),
```

Push test predicates are easy to write using the Atomist API. For example:

```typescript
export const IsMaven: PredicatePushTest = predicatePushTest(
    "Is Maven",
    async p => !!(await p.getFile("pom.xml")));
```

Goals are defined as follows:

```typescript
export const HttpServiceGoals = new Goals(
    "HTTP Service",
    FingerprintGoal,
    AutofixGoal,
    ReviewGoal,
    PushReactionGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
    ProductionDeploymentGoal,
    ProductionEndpointGoal);
```

It is possible to define new goals with accompanying implementations, making this approach highly extensible.

#### Listeners
We'll return to push tests shortly, but first let's consider the SDM listener concept.

While the goals set drive the delivery process, domain specific **listeners** help in goal implementation and allow observation of the process as it unfolds. Listener **registrations** allow selective listener firing, on only particular pushes. A registration includes a name (for diagnostics) and a `PushTest`, narrowing on particular pushes.

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

> SDM listeners are a layer above GraphQL subscriptions and event handlers that simplify common scenarios, and enable most functionality to be naturally expressed in terms of the problem domain. Listener implementations are also easily testable.

##### Common Listener Context
As with all good frameworks, we've tried to make the API consistent. All listener invocations include at least the following generally useful information:

```typescript
export interface SdmContext {

    /**
     * Context of the Atomist EventHandler invocation. Use to run GraphQL
     * queries, use the messageClient directly and find
     * the team and correlation id
     */
    context: HandlerContext;

    /**
     * If available, provides a way to address the channel(s) related to this event.
     * This is usually, but not always, the channels linked to a
     * In some cases, such as repo creation or a push to a repo where there is no linked channel,
     * addressChannels will go to dev/null without error.
     */
    addressChannels: AddressChannels;

    /**
     * Credentials for use with source control hosts such as GitHub
     */
    credentials: ProjectOperationCredentials;

}
```
Most events concern a specific repository, and hence most listener invocations extend `RepoContext`:

```typescript
export interface RepoContext extends SdmContext {

    /**
     * The repo this relates to
     */
    id: RemoteRepoRef;

}
```

Many repo-specific listeners are given access to the repository source, via the `Project` abstraction:

```typescript
export interface ProjectListenerInvocation extends RepoListenerInvocation {

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
The `Project` interface is defined in [@atomist/automation-client](https://github.com/atomist/automation-client-ts). It provides an abstraction to the present repository, with Atomist taking care of Git cloning and (if necessary) writing back any changes via a push. It is abstracted from the file system, making it easy to unit listeners accessing repository contents, using the `InMemoryProject` and `InMemoryFile` classes. 

> The Project API and sophisticated parsing functionality available on top of it is a core Atomist capability. Many events can only be understood in the context of the impacted code, and many actions are achieved by modifying code.

Push listeners also have access to the details of the relevant push:

```typescript
export interface PushListenerInvocation extends ProjectListenerInvocation {

	 /**
     * Information about the push, including repo and commit
     */
    readonly push: OnPushToAnyBranch.Push;

}
```

##### Available Listener Interfaces
The following listener interfaces are available:

- `ArtifactListener`: Invoked when a new binary has been created
- `BuildListener`: Invoked when a build is complete. 
- `ChannelLinkListenerInvocation`: Invoked when a channel is linked to a repo
- `ClosedIssueListener`: Invoked when an issue is closed
- `PushReactionListener`: Invoked in response to a code change
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
Let's now return to push mappings and goal setting. The `PushMapping` interface is used to decide how to handle pushes. Normally it is used via the DSL we've seen.

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
`PushMapping` is a central interface used in many places.

A `GoalSetter` is a `PushMapping` that returns `Goals`.

A `PushTest` is simply a `PushMapping` that returns `boolean`.

## Code Examples
Let's look at some examples of listeners.

### Issue Creation
When a new issue is created, you may want to notify people or perform an action.
#### Listener interfaces
1. `NewIssueListener`: [NewIssueListener](src/api/listener/NewIssueListener.ts)

#### Examples
The following example notifies any user who raises an issue with insufficient detail in the body, via a 
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

Using the `credentials` on the `NewIssueInvocation`, you can easily use the GitHub API to modify the issue, for example correcting spelling errors.

### Repo Creation
We frequently want to respond to the creation of a new repository: For example, we may want to notify people, provision infrastructure, or tag it with GitHub topics based on its contents.

#### Listener interfaces
There are two scenarios to consider:

1. The creation of a new repository. `RepoCreationListener`: [RepoCreationListener](src/api/listener/RepoCreationListener.ts)
2. The first push to a repository, which uses the more generic [ProjectListener](src/api/listener/PushListener.ts)

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

##### ReviewerRegistration
`ProjectReviewer` is a type defined in `automation-client-ts`. It allows a structured review to be returned. The review comments can localize the file path, line and column if such information is available, and also optionally include a link to a "fix" command to autofix the problem.

The following is a simple project reviewer spots projects without a README, using the `Project` API:

```typescript
const hasNoReadMe: ReviewerRegistration = {
    name: "hasNoReadme",
    action: async cri => ({
        repoId: cri.project.id,
        comments: !!(await cri.project.getFile("README.me")) ?
            [] :
            [new DefaultReviewComment("info", "readme",
                "Project has no README",
                {
                    path: "README.md",
                    lineFrom1: 1,
                    offset: -1,
                })],
    }),
};
```
A slightly more complex example uses the `saveFromFiles` utility method to look for and object to YAML files in Maven projects:

```typescript
const rodHatesYaml: ReviewerRegistration = {
    name: "rodHatesYaml",
    pushTest: hasFile("pom.xml"),
    action: async cri => ({
        repoId: cri.project.id,
        comments:
            await saveFromFiles(cri.project, "**/*.yml", f =>
                new DefaultReviewComment("info", "yml-reviewer",
                    `Found YML in \`${f.path}\`: Rod regards the format as an insult to computer science`,
                    {
                        path: f.path,
                        lineFrom1: 1,
                        offset: -1,
                    })),
    }),
};

```

These reviewers can be added in an SDM definition as follows:

```typescript
sdm.addProjectReviewers(hasNoReadme, rodHatesYaml);
```
##### AutofixRegistration

An `AutofixRegistration` can automatically execute code fixes. An example, which adds a license to file if one isn't found:

```typescript
export const AddLicenseFile: AutofixRegistration = editorAutofixRegistration({
    name: "License Fix",
    pushTest: not(hasFile(LicenseFilename)),
    editor: async p => {
        const license = await axios.get("https://www.apache.org/licenses/LICENSE-2.0.txt");
        return p.addFile("LICENSE", license.data);
    },
});
```
Note the use of the `addFile` method on `Project`. Atomist takes care of committing the change to the 
branch of the push.

Registration with an SDM is simple:

```typescript
sdm.addAutofixes(
    AddAtomistJavaHeader,
    AddAtomistTypeScriptHeader,
    AddLicenseFile,
);
```

##### CodeActionRegistration interface
This registration allows you to react to the code, with information about the changes in the given push:

For example, the following function lists changed files to any linked Slack channels for the repo:

```typescript
export const listChangedFiles: PushReactionRegistration = {
    action(i: PushImpactListenerInvocation) {
        return i.addressChannels(`Files changed:\n${i.filesChanged.map(n => "- `" + n + "`").join("\n")}`);
    },
    name: "List files changed",
};
```

If you don't have a custom name or PushTest, you can use the following shorthand:


```typescript
export const listChangedFiles = i => i.addressChannels(`Files changed:\n${i.filesChanged.map(n => "- `" + n + "`").join("\n")}`);

```

Add in an SDM definition as follows:

```typescript
sdm.addPushReactions(listChangedFiles)
```
> If your reaction is essentially a review--for example, it's associated with a known problem in a particular file location--use a `ReviewerRegistration` rather than a `PushReactionRegistration`.
> 
> Important note: You must have set a `PushReactionGoal` for push reactions to be invoked

#### Fingerprints
A special kind of push listener relates to **fingerprints**.

Fingerprints are data computed against a push. Think of them as snapshots. Typically they reflect the state of the repository's source code after the push; they can also take into account other characteristics of the commit. Fingerprinting is valuable because:

1. *It enables us to assess the impact of a particular commit, through providing a semantic diff*. For example, did the commit change dependencies? Did it change some particularly sensitive files that necessitate closer than usual review?
2. *It enables us to understand the evolution of a code base over time.* Atomist persists fingerprints, so we can trace over time anything we fingerprint, and report against it. For example, what is happening to code quality metrics over time?

Atomist ships some out of the box fingerprints, such as Maven and `npm` dependency fingerprints. But it's easy to write your own. Fingerprint registrations are like other listener registrations, specifying a name and `PushTest`. The following example is the complete code for fingerprinting dependencies specified in a `package-lock.json` file:

```typescript
export class PackageLockFingerprinter implements FingerprinterRegistration {

    public readonly name = "PackageLockFingerprinter";

    public readonly pushTest: PushTest = IsNode;

    public async action(cri: PushImpactListenerInvocation): Promise<FingerprinterResult> {
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

Fingerprinters can be added to an SDM as follows:

```typescript
sdm.addFingerprinterRegistrations(new PackageLockFingerprinter());
```

Fingerprinting will only occur if a `FingerprintGoal` is selected when goals are set.

## Generators
Another important concern is project creation. Consistent project creation is important to governance and provides a way of sharing knowledge across a team.

Atomist's [unique take on project generation](https://the-composition.com/no-more-copy-paste-bf6c7f96e445) starts from a **seed project**--a kind of golden master, that is version controlled using your regular repository hosting solution. A seed project doesn't need to include template content: It's a regular project in whatever stack, and Atomist transforms it to be a unique, custom project based on the parameters supplied at the time of project creation. This allows freedom to evolve the seed project with regular development tools.

Generators can be registered with an SDM as follows:

```typescript
sdm.addGenerators(() => springBootGenerator({
    ...CommonJavaGeneratorConfig,
    seedRepo: "spring-rest-seed",
    intent: "create spring",
}))
```

The `springBootGenerator` function used here is provided in `sample-sdm`, but it's easy enough to write your own transformation using the `Project` API. Here's most of the code in our real Node generator:

```typescript
export function nodeGenerator(config: GeneratorConfig,
                              details: Partial<GeneratorCommandDetails<NodeProjectCreationParameters>> = {}): HandleCommand {
    return generatorHandler<NodeProjectCreationParameters>(
        transformSeed,
        () => new NodeProjectCreationParameters(config),
        `nodeGenerator-${config.seedRepo}`,
        {
            tags: ["node", "typescript", "generator"],
            ...details,
            intent: config.intent,
        });
}

function transformSeed(params: NodeProjectCreationParameters, ctx: HandlerContext) {
    return chainEditors(
        updatePackageJsonIdentification(params.appName, params.target.description,
            params.version,
            params.screenName,
            params.target),
        updateReadmeTitle(params.appName, params.target.description),
    );
}
```

You can invoke such a generator from Slack, like this:

<img src="https://github.com/atomist/github-sdm/blob/master/docs/create_sample1.png?raw=true"/>

Note how the repo was automatically tagged with GitHub topics after creation. This was the work of a listener, specified as follows:

```typescript
sdm.addNewRepoWithCodeActions(
    tagRepo(springBootTagger),
);
```

With Atomist ChatOps supports, you can follow along in a linked channel like this:

<img src="https://github.com/atomist/github-sdm/blob/master/docs/sample1_channel.png?raw=true"/>

Note the suggestion to add a Cloud Foundry manifest. This is the work of another listener, which reacts to finding new code in a repo. Listeners and commands such as generators work hand in hand for Atomist.

## Editors
Another core concept is a project **editor**. An editor is a command that transforms project content. Atomist infrastructure can help persist such transformations through branch commits or pull requests, with clean diffs.

### A Simple Editor
As you'd expect, editors also use th `Project` API.

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
More elaborate editors use helper APIs on top of the `Project` API such as Atomist's [microgrammar](https://github.com/atomist/microgrammar) API and [ANTLR](https://github.com/atomist/antlr-ts) integration.

There's also an important capability called "dry run editing": Performing an edit on a branch, and then either raising either a PR or an issue, depending on build success or failure. This allows us to safely apply edits across many repositories. There's a simple wrapper function to enable this:

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
This editor will upgrade the Spring Boot version in one or more projects, then wait to see if the builds succeed. Output will look like this (in the case of success):

<img src="https://github.com/atomist/github-sdm/blob/master/docs/dry_run_upgrade.png?raw=true"/>

> Dry run editing is another example of how commands and events can work hand in hand with Atomist to provide a uniquely powerful solution.


## Arbitrary Commands
Both generators and editors are special cases of Atomist **command handlers**, which can be invoked via Slack or HTTP. You can write commands to ensure that anything that needs to be repeated gets done the right way each time, and that the solution isn't hidden on someone's machine.

## Pulling it All Together: The `SoftwareDeliveryMachine` class

Your ideal delivery blueprint spans delivery flow, generators, editors and other commands. All we need is something to pull it together.

Your event listeners need to be invoked by Atomist handlers. The `SoftwareDeliveryMachine` takes care of this, ensuring that the correct handlers are emitted for use in `atomist.config.ts`, without you needing to worry about the event handler registrations on underlying GraphQL.

The `SoftwareDeliveryMachine` class offers a fluent builder approach to adding command handlers, generators and editors.

### Example
For example:

```typescript
    const sdm = createSoftwareDeliveryMachine(
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
        .addPushReactions(listChangedFiles)
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

- `src/api` is the public user-facing API, including the software delivery machine concept that ties everything together. *This may be extracted into its own Node module in future.*
- `src/spi` contains interfaces to be extended in integrations with infrastructure,
such as artifact storage, logging, build and deployment.
- `src/graphql` contains GraphQL queries. You can add fields to existing queries and subscriptions, and add your own.
- `src/typings` is where types generated from GraphQL wind up. Refresh these with `npm run gql:gen` 
if you update any GraphQL files in `src/graphql`.
- `src/util` contains miscellaneous utilities.
- `src/internal` contains lower level code such as event handlers necessary to support the user API. This is not intended for user use.
- `src/pack` contains "extension packs." These will ultimately be extracted into their own Node modules.
- The other directories unders `src` contain useful functionality that may eventually be moved out of this project.

The types from `src/api` can be imported into downstream projects from the `index.ts` barrel.

## Plugging in Third Party Tools

This repo shows the use of Atomist to perform many steps itself. However, each of the goals used by Atomist here is pluggable.

It's also easy to integrate third party tools like Checkstyle.

### Integrating CI tools
One of the tools you are most likely to integrate is CI. For example, you can integrate Jenkins, Travis or Circle CI with Atomist so that these tools are responsible for build. This has potential advantages in terms of scheduling and repeatability of environments.

Integrating a CI tool with Atomist is simple. Simply invoke Atomist hooks to send events around build and artifact creation.

If integrating CI tools, we recommend the following:

- CI tools are great for building and generating artifacts. They are often abused as a PaaS for `bash`. If you find your CI usage has you programming in `bash` or YML, consider whether invoking such operations from Atomist event handlers might be a better model.
- Use Atomist generators to create your CI files, and Atomist editors to keep them in synch, minimizing inconsistency.

### Integrating APM tools
tbd

### Integrating with Static Analysis Tools
Any tool that runs on code, such as Checkstyle, can easily be integrated.

If the tool doesn't have a Node API (which Checkstyle doesn't as it's written in Java), you can invoke it via Node `spawn`, as Node excels at working with child processes.

## Advanced Push Rules

### Computed Values
You can use computed `boolean` values or the results of synchronous or asynchronous functions returning `boolean` in the DSL, making it possible to bring in any state you wish. For example:

```typescript
whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, 
	deploymentsToday < 25)
    .itMeans("Not tired of deploying Spring apps yet")
    .setGoals(LocalDeploymentGoals),
```

### Decision Trees
You can write decision trees in push rules or other push mappings. These can be nested to arbitrary depth, and can use computed state. For example:

```typescript
let count = 0;
const pm: PushMapping<Goals> = given<Goals>(IsNode)
	// Compute a value we'll use later
    .init(() => count = 0)	
    .itMeans("node")
    .then(
        given<Goals>(IsExpress).itMeans("express")
            .compute(() => count++)
            // Go into tree branch rule set
            .then(
                whenPushSatisfies(count > 0).itMeans("nope").setGoals(NoGoals),
				whenPushSatisfies(TruePushTest).itMeans("yes").setGoals(HttpServiceGoals),
            ),
    );
```

### "Contribution" Style
tbd

## Roadmap

This project is under active development, and still in flux. Some goals:

- Splitting out `sdm-api` project with the contents of the `src/api` directory
- Extracting the extension packs under `src/pack` into their own Node modules.
