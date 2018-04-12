# GitHub Software Delivery Machine

Atomist framework enabling you to control your delivery and development process in code.

## What is a Software Delivery Machine?
>A **software delivery machine** is a development process in a box. 

It automates all steps in the flow from commit to production (potentially via staging environments), and many other actions, using the consistent model provided by the Atomist *API for software*.

> Many teams have a blueprint in their mind for how they'd like to deliver software and ease their day to day work, but find it hard to realize. A Software Delivery Machine makes it possible.

The concept is explained in detail in Rod Johnson's blog [Why you need a Software Delivery Machine](https://the-composition.com/why-you-need-a-software-delivery-machine-85e8399cdfc0). This [video](https://vimeo.com/260496136) shows it in action.


## Get Started

This delivery machine feeds on the Atomist API. You'll need to be a member of an Atomist workspace to run it. <!-- TODO: reference auth story -->
Create your own by [enrolling](https://github.com/atomist/welcome/blob/master/enroll.md) at [atomist.com](https://atomist.com).

Things work best if you install an org webhook, so that Atomist receives events for all your GitHub repos.

## Get your Software Delivery Machine

If the Atomist bot is in your Slack team, type `@atomist create sdm` to have Atomist create a personalized version of
 this repository for you.
 
You can fork and clone this repository.

## Run Locally

This is an Atomist automation client. See [run an automation client](https://github.com/atomist/welcome/blob/master/runClient.md) for instructions on how to set up your environment and run it under Node.js. 

See [integrations](#Integrations) for additional prerequisites according to the projects you're building. 

The client logs to the console so you can see it go. Once it runs, here are some things to do:

### Start a new project

In Slack, `@atomist create spring`. This will create a Spring Boot repository. The SDM will build it!

To enable deployment beyond the local one, `@atomist enable deploy`.

### Push to an existing repository

If you have any Java or Node projects in your GitHub org, try linking one to a Slack channel (`@atomist link repo`), and then push to it.
You'll see Atomist react to the push, and the SDM might have some Goals it can complete.

### Customize

Every organization has a different environment and different needs. Your software delivery machine is yours: change the code and do what helps you.

In `atomist.config.ts`, you can choose the `machine` to start with. `cloudFoundryMachine` and `k8sMachine` take care of the whole delivery process from project creation through deployment, while other machines focus only on one aspect, such as project creation, static analysis or autofixing problems in repositories.

> Atomist is about developing your development experience by using your coding skills. Change the code, restart, and see your new automations and changed behavior across all your projects, within seconds. 

The rest of this README describes some changes you might make.

# About this Software Delivery Machine

## Implementations of Atomist
Atomist is a flexible system, enabling you to build your own automations or use those provided by Atomist or third parties.

This repository is a *reference implementation* of Atomist, which focuses on the goals of a typical delivery
 flow. You can fork it and modify it as the starting point for your own Atomist implementation, 
 or use it purely as a reference.

## Concepts
This repository shows how Atomist can automate important tasks and improve your delivery flow. Specifically:

- How Atomist **command handlers** can be used to create services
the right way every time, and help keep them up to date 
- How Atomist **event handlers** can drive and improve a custom delivery experience, from commit through 
to deployment and testing

It demonstrates Atomist as the *API for software*, exposing

- *What we know*: The Atomist cortex, accessible through GraphQL queries and subscription joins
- *What just happened*: An event, triggered by a GraphQL subscription, which is contextualized with the existing knowledge
- *What you're working on*: A library that enables you to comprehend and manipulate the source code you're working on.

Atomist is not tied to GitHub, but this repository focuses on using Atomist with GitHub.com or
GitHub Enterprise.

## Key Functionality
The following key functionality of this project will be available when you run this automation client in your team:

- *Project creation for Spring*. Atomist is not Spring specific, but we use Spring boot as an illustration here. Try `@atomist create spring`. The seed project used by default will be `spring-team/spring-rest-seed`. 
 - If you want to add or modify the content of generated projects, modify `CustomSpringBootGeneratorParameters.ts` to specify your own seed. Just about any Spring Boot project will work as the transformation of a seed project is quite forgiving, and parses the seed to find the location and name of the `@SpringBootApplication` class, rather than relying on hard coding. 
 - To perform sophisticated changes, such as dynamically computing content, modify the code in `springBootGenerator.ts`. 
- *Delivery pipeline to either Kubernetes or Pivotal Cloud Foundry for Spring Boot projects*. This includes automatic local deployment of non-default branches on the same node as the automation client. The delivery pipeline is automatically triggered on pushes.
- *Upgrading Spring Boot version* across one or many repositories. Try `@atomist try to upgrade spring boot`. This will create a branch upgrading to Spring Boot `1.5.9` and wait for the build to complete. If the build succeeds, a PR will be created; if it fails, an issue will be created linking to the failed build log and offending branch. To choose a specific Spring Boot version, or see what happens when a bogus version triggers a failure, try `@atomist try to upgrade spring boot desiredBootVersion=<version>`. If you run such a command in a channel linked to an Atomist repository, it will affect only that repository. If you run it in a channel that is not linked, it will affect all repositories by default. You can add a `targets.repos=<regex>` parameter to specify a regular expression to target a subset of repo names. For example: `@atomist try to upgrade spring boot targets.repos=test.*`.

This project builds on other Atomist core functionality available from global automations, such as:

- Atomist **lifecycle** for GitHub, showing commit, pull request and other activity through actionable messages.
- Issue handling:
	- `@atomist create issue`

Type `@atomist show skills` in any channel to see a list of all available Atomist commands.

## Events
The heart of Atomist is its event handling. As your code flows from commit
through to deployment and beyond, Atomist receives events, correlates the incoming data
with its previous knowledge, and invokes your event handlers with rich context. This enables you to perform tasks such as:

- Scanning code for security or quality issues on every push
- Driving deployments and promotion between environments
- Performing custom actions on deployment, such as kicking off integration test suites.

Its correlated event model also enables Atomist to provide you with visibility throughout the commit to deployment flow, in Slack or through the Atomist web dashboard.

Event handlers subscribe to events using GraphQL subscriptions. The following example subscribes to completed builds:

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

## Events and Goals

The key events handled in this repository are:

- _On repo creation_. When a new repository has been created, we often want to perform
additional actions, such as provisioning an issue tracker. We provide a hook for this
and also demonstrate how to add GitHub topics based on initial repo content.  
- _On push to a repo._ This is often a trigger for code review or other actions based on the code. Specifically, we allow
   - Analysis of semantic diffs: What is the meaning of what changed?
	- Code review, including using external tools such as Checkstyle
	- Autofixes: Linting or making other automatic corrections such as supplying missing license files
	- Arbitrary actions on the code, such as notifying people or systems of significant changes
- _On build result_: For example, notifying a committer who has broken the build, or setting a build status.
- _On image link (a binary artifact has been built)_ A trigger for deployment.
- _On successful deployment_, as shown by a GitHub status.
- _On validation of a deployed endpoint_, as shown by a GitHub status.

## Structure of This Project

This repository contains the entire implementation of the software delivery machine
built on Atomist event and command handlers. It's all here if you want to dig into it,
 but most of your changes will be 
at a higher level: choosing goals and adding high-level listeners.

Start with `atomist.config.ts` and find the choice of Software Delivery Machine to start with,
`cloudFoundrySoftwareDeliveryMachine` or kubernetes. Click into the definition of those to see the setting of goals
and all the other components that go into the machine.

This code is in `src/software-delivery-machine`, and that is where we recommend you make changes.

### Library code

The following directories will later become available as a library. We'll keep working on the implementations,
while the interfaces will change less.
> In particular, the event listener interfaces discussed later in the document are expected to remain stable.

- The `src/spi` directory contains interfaces that are likely to be extended in integrations with infrastructure,
such as artifact storage, logging, build and deployment.
- `src/blueprint`
- `src/common`
- `src/graphql` contains GraphQL queries. You can add fields to existing queries and subscriptions, and add your own.
- `src/handlers` contains handlers that implement general SDM concepts. This is lower level infrastructure, which you generally won't need to modify directly.
- `src/typings` is where generated-from-graphql types wind up. Refresh these with `npm run gql:gen` 
if you update any GraphQL files in `src/graphql`.
- `src/util` 

## GitHub Statuses
We use the following GitHub statuses as events to drive our flow and show the goals:

> The use of GitHub statuses to drive and identify stages in the flow is a choice in this implementation. It's just one strategy and the core listener interfaces are decoupled from it.

## Goals in Detail
Each of the delivery goals results in the triggering of domain specific
 listeners that are provided with the appropriate context to process the event: 
 For example, access to the project source code in the case of a code review, 
 or access to the reported URL for a deployed endpoint. 
 Certain properties are common to all events, enabling communication with users via Slack, 
 and providing credentials for calls to GitHub.

All listener invocations receive at least the following generally useful information:

```typescript
export interface ListenerInvocation {

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
A push to the source control hosting system is typically a very important trigger for actions. The `SoftwareDeliveryMachine` divides the actions into several steps:

- Code Review
- Code
- To Be Completed

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

tbc

### Deployment Result
#### Listener interfaces

#### Examples
### Endpoint Reported
#### Listener interfaces

#### Examples
### Endpoint Verification
#### Listener interfaces

#### Examples
## Pulling it All Together: The `SoftwareDeliveryMachine` class

Your event listeners need to be invoked by Atomist handlers. The `SoftwareDeliveryMachine` takes care of this, ensuring that the correct handlers are emitted for use in `atomist.config.ts`.

It also allows you to use a fluent builder approach to adding command handlers, generators and editors.

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
        .addFingerprintDifferenceListeners(diff1)
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
commands: assembled.commandHandlers.concat([
        // other command handlers,
    ]),
    events: assembled.eventHandlers.concat([
    		// other event handlers
    ]),
```

## Plugging in Third Party Tools

This repo shows the use of Atomist to perform many steps itself.
 However, each of the goals used by Atomist here is pluggable.

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

### Integrations

### Choose a machine
You must set environment variables to choose a machine, if you override the default.
```
export MACHINE_PATH="./software-delivery-machine/machines"
export MACHINE_NAME="cloudFoundrySoftwareDeliveryMachine"
```

### Local HTTP server
To run a local HTTP server to invoke via `curl` or for smoke testing, please set the following environment variable:

```
export LOCAL_ATOMIST_ADMIN_PASSWORD="<value>"

```

#### Java

To build Java projects on the automation client node, you'll need:

- JDK, for Maven and Checkstyle
- Maven, with `mvn` on the path

#### Node

To build Node projects on the automation client node, you'll need:

- `npm` - v 5.8.0 or above
- `node`

#### Cloud Foundry

In order to enable Pivotal Cloud Foundry deployment, the following environment variables are used.

Required:

- `PIVOTAL_USER`: your Pivotal Cloud Foundry user name
- `PIVOTAL_PASSWORD`: your Pivotal Cloud Foundry password 
- `PCF_ORG`: your Pivotal Cloud Foundry organization name
- `PCF_SPACE_STAGING`: your Pivotal Cloud Foundry staging space name within `$PCF_ORG`
- `PCF_SPACE_PRODUCTION`: your Pivotal Cloud Foundry production space name within `$PCF_ORG`

Optional:

- `PIVOTAL_API`: PCF API to hit. Default if this key is not provided is Pivotal Web Services at `https://api.run.pivotal.io`. Specify a different value to deploy to your own Cloud Foundry instance.


#### Kubernetes

The kubernetesSoftwareDevelopmentMachine included here deploys to an Atomist sandbox kubernetes environment, using
[k8-automation](https://github.com/atomist/k8-automation) which we run inside our cluster. You can deploy the Spring Boot
projects created with `@atomist create spring` here, in order to try out the Kubernetes integration with the SDM.

#### Checkstyle
 
Checkstyle is a style-checker for Java.
For the optional Checkstyle integration to work, set up two Checkstyle environment variables as follows:

```
# Toggle Checkstyle usage
export USE_CHECKSTYLE=true

# Path to checkstyle JAR
export CHECKSTYLE_PATH="/Users/rodjohnson/tools/checkstyle-8.8/checkstyle-8.8-all.jar"
```

Get `checkstyle-8.8-all.jar` from [Checkstyle's download page](https://sourceforge.net/projects/checkstyle/files/checkstyle/8.8/).


## Roadmap

This project is under active development, and still in flux. Some goals:

- Breaking the repo into two, to separate the runnable instance from a library module exposing listener interfaces and other public types and common functionality.
- Support for BitBucket, as well as GitHub.
