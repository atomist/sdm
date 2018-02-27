# GitHub SDM

GitHub Software Delivery Machine.

## What is a "Software Delivery Machine?"
A **software delivery machine** is like a development process in a box. It automates many actions and many steps in the flow from commit to productions.

## Concepts
This repository shows how Atomist can automate important tasks,
and improve your delivery flow. Specifically:

- How Atomist command handlers and event handlers can be used to create services
the right way every time, and help keep them up to date 
- How Atomist event handlers can drive and improve a custom delivery experience, from commit through 
to deployment and testing

This repository is intended for
use both as a starting point for your own Atomist implementation, and as a reference.

Atomist is not tied to GitHub, but this repository focuses on using Atomist with GitHub.com or
GitHub Enterprise.

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

## Key Events

The key events handled in this repository are:

- _On repo creation_. When a new repository has been created, we often want to perform
additional actions, such as provisioning an issue tracker. We provide a hook for this
and also demonstrate how to add GitHub topics based on initial repo content.  
- _On push to a repo._ This is often a trigger for code review or other actions based on code.
- _On image link._ A trigger for deployment.
- _On successful deployment_, as shown by a GitHub status.
- _On validation of a deployed endpoint_, as shown by a GitHub status.

## GitHub Statuses
We use the following GitHub statuses to drive our flow and show the stages:

- tbd

This is configurable


## "Blueprint" interfaces and classes

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
- JDK
- Maven, with `mvn` on the path


### Environment Variables
For the optional Checkstyle integration to work, set up a Checkstyle environment variable as follows:

```
# Path to checkstyle JAR
export CHECKSTYLE_PATH="/Users/rodjohnson/tools/checkstyle-8.8/checkstyle-8.8-all.jar"
```

Get checkstyle-8.8-all.jar from [Checkstyle's download page](https://sourceforge.net/projects/checkstyle/files/checkstyle/8.8/).