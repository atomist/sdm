# GitHub SDM

GitHub Software Delivery Machine.

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

## Key events
The heart of Atomist is its event handling. As your code flows from commit
through to deployment and beyond, Atomist receives events, correlates the incoming data
with its previous knowledge, and can invoke your event handlers.

Event handlers subscribe to events using GraphQL subscriptions. This repository
includes event handlers that subscribe to some of the most important events in a typical
delivery flow. This enables dynamic and sophisticated delivery processes that are consistent across
multiple projects.

The key events handled in this repository are:

- _On repo creation_. When a new repository has been created, we often want to perform
additional actions, such as provisioning an issue tracker. We provide a hook for this
and also demonstrate how to add GitHub topics based on initial repo content.  
- _On push to a repo._ Code push
- _On build result._ 
- _On image link._
- _On successful deployment_, as shown by a GitHub status.
- _On validation of a deployed endpoint_, as shown by a GitHub status.

Promotion


## "Blueprint" interfaces and classes

## Environment variables
For the optional Checkstyle integration to work, set up a Checkstyle environment variable as follows:

```
# Path to checkstyle JAR
export CHECKSTYLE_PATH="/Users/rodjohnson/tools/checkstyle-8.8/checkstyle-8.8-all.jar"
```

Get checkstyle-8.8-all.jar from [Checkstyle's download page](https://sourceforge.net/projects/checkstyle/files/checkstyle/8.8/).