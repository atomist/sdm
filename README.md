# GitHub SDM

**GitHub Software Delivery Machine**: An Atomist reference implementation.

## What is a "Software Delivery Machine?"
A **software delivery machine** is a development process in a box. It automates all steps in the flow from commit to productions, and many other actions, using the consistent model provided by Atomist's API for software.

## Implementations of Atomist
Atomist is a flexible system, enabling you to build your own automations or use those provided by Atomist or third parties.

This repository is a *reference implementation* of an Atomist, which focuses on the phases of a typical delivery flow. You can fork it and modify it as the starting point for your own Atomist implementation, or use it purely as a reference.

## Concepts
This repository shows how Atomist can automate important tasks and improve your delivery flow. Specifically:

- How Atomist command handlers and event handlers can be used to create services
the right way every time, and help keep them up to date 
- How Atomist event handlers can drive and improve a custom delivery experience, from commit through 
to deployment and testing

It demonstrates Atomist as the *API for software*, exposing

- *What we know*: The Atomist cortex, accessible through GraphQL queries and subscription joins
- *What just happened*: An event, triggered by a GraphQL subscription, which is contextualized with the existing knowledge
- *What you're working on*: A library that enables you to comprehend and manipulate the source code you're working on.

Atomist is not tied to GitHub, but this repository focuses on using Atomist with GitHub.com or
GitHub Enterprise.

## Structure of This Project
The exports in the `src/index.ts` file represent the public API of this repository, which is more likely than other code to remain stable.

The `src/software-delivery-machine` directory contains an example of an implementation of Atomist, using the other functionality. This is the code you would be likely to change. 

## Events
The heart of Atomist is its event handling. As your code flows from commit
through to deployment and beyond, Atomist receives events, correlates the incoming data
with its previous knowledge, and invokes your event handlers with rich context. This enables you to perform tasks such as:

- Scanning code for security or quality issues on every push
- Driving deployments and promotion between environments

It also enables Atomist to provide you with visibility throughout the commit to deployment flow, in Slack or through the Atomist web dashboard.

Event handlers subscribe to events using GraphQL subscriptions. This repository
includes event handlers that subscribe to some of the most important events in a typical
delivery flow. This enables dynamic and sophisticated delivery processes that are consistent across
multiple projects.

## Core Concepts
This reference implementation has the following core concepts:

- Key phases in the delivery flow, with easy ways to respond to them
- Additional event handlers, relating to issues
- Other automations, allowing you to create new services and update existing services
- A buildable software delivery machine

## Events and Phases

The key phases handled in this repository are:

- _On repo creation_. When a new repository has been created, we often want to perform
additional actions, such as provisioning an issue tracker. We provide a hook for this
and also demonstrate how to add GitHub topics based on initial repo content.  
- _On push to a repo._ This is often a trigger for code review or other actions based on code. Specifically, we allow
   - Analysis of semantic diffs: What is the meaning of what changed?
	- Code review, including using external tools such as Checkstyle
	- Autofixes
	- Arbitrary actions on the code, such as notifying people or systems of the changes
- _On build result_
- _On image link._ A trigger for deployment.
- _On successful deployment_, as shown by a GitHub status.
- _On validation of a deployed endpoint_, as shown by a GitHub status.

## GitHub Statuses
We use the following GitHub statuses to drive our flow and show the stages:

- tbd

This is configurable

## Phases in Detail
Each of the phases results in the triggering of domain specific listeners that are provided with the appropriate context to process the event: For example, access to the project source code in the case of a code review, or access to the reported URL for a deployed endpoint. Certain properties are common to all events, enabling communication with users via Slack, and providing credentials for calls to GitHub.

The listener interfaces are

| User/system action  |  Atomist phases | Event Handlers |
|---|---|---|---|---|
| Issue creation  |  <ul><li>Handler1</li></ul> |  <ul><li>Handler1</li></ul> | 
| Repo creation  |  <ul><li>Handler1</li></ul> |  <ul><li>Handler1</li></ul> | 
| Push to repo  |  <ul><li>Phase creation</li><li>Scan</li><li>Autofix</li><li>Review</li><li>Inspect</li><li>Build</li></ul> |  <ul><li>Handler1</li></ul>  |  
| Push to repo  |  <ul><li>Handler1</li></ul> |  <ul><li>Handler1</li></ul>  |  
| Deployment result |  <ul><li>Handler1</li></ul> |  <ul><li>Handler1</li></ul> |
| Endpoint reported |  <ul><li>Handler1</li></ul> |  <ul><li>Handler1</li></ul> |  
| Endpoint verification |  <ul><li>Handler1</li></ul> |  <ul><li>Handler1</li></ul> |

All listeners receive the following information:

```typescript
export interface ListenerInvocation {

    /**
     * The repo this relates to
     */
    id: GitHubRepoRef;

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


#### Examples

### Repo Creation
#### Listener interfaces

#### Examples

### Push
#### Listener interfaces

#### Examples

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

It also allows you to use a fluent builder approach to adding command handlers. generators and editors.

### Example
```typescript
const sdm = new SoftwareDeliveryMachine(
        LocalBuildOnSuccessStatus,
        () => LocalMavenDeployer);
    sdm.addPromotedEnvironment(promotedEnvironment);
    sdm.addPhaseCreators(
        new SpringBootDeployPhaseCreator(),
        new NodePhaseCreator(),
        new JavaLibraryPhaseCreator(),
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
        .addProjectReviewers(logReview);
   
    sdm.addCodeReactions(listChangedFiles)
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

In `atomist.config.ts` you can bring them in as follows:

```typescript
commands: assembled.commandHandlers.concat([
        // other command handlers,
    ]),
    events: assembled.eventHandlers.concat([
    		// other event handlers
    ]),
```

## Plugging in Third Party Tools

This repo shows the use of Atomist to perform many steps itself. However, each of the phases used by Atomist here is pluggable.

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

## Running this Project

### Binary Dependencies
To start up these project, you will need the following on the deployment node:

- `git` binary
- JDK, for Maven and Checkstyle
- Maven, with `mvn` on the path


### Environment Variables
For the optional Checkstyle integration to work, set up a Checkstyle environment variable as follows:

```
# Path to checkstyle JAR
export CHECKSTYLE_PATH="/Users/rodjohnson/tools/checkstyle-8.8/checkstyle-8.8-all.jar"
```

Get checkstyle-8.8-all.jar from [Checkstyle's download page](https://sourceforge.net/projects/checkstyle/files/checkstyle/8.8/).