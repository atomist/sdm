<p align="center">
  <img src="https://images.atomist.com/sdm/SDM-Logo-Dark.png">
</p>
 
# Software Delivery Machine - `@atomist/sdm`

This is the home of the Software Delivery Machine (SDM) framework and
related projects.

The SDM framework enables you to control your delivery process in
code. Think of it as an API for your software delivery. See the
[Atomist documentation][atomist-doc] for more information on the
concept of a software delivery machine and how to create and develop
an SDM.

[atomist-doc]: https://docs.atomist.com/ "Atomist Documentation"

## Getting started

See the [Developer Quick Start][atomist-quick] to jump straight to
creating an SDM.

[atomist-quick]: https://docs.atomist.com/quick-start/ "Atomist - Developer Quick Start"

## Migrating to SDM 2.0

SDM version 2.0 aims to make it easier to use the SDM framework. We
have consolidated the most useful NPM packages under
[@atomist/sdm][sdm-npm] to simplify dependency management. Rather
than separately installing @atomist/automation-client,
@atomist/sdm-core, and various @atomist/sdm-pack-\*, you now just
install @atomist/sdm. @atomist/sdm-local is deprecated.

To update to the new single package in your SDM, follow these steps:

1.  Remove Atomist SDM and automation-client dependencies

        $ npm uninstall @atomist/automation-client @atomist/sdm @atomist/sdm-core @atomist/sdm-local

2.  Remove any extension SDM packs

        $ npm uninstall @atomist/sdm-pack-ABC @atomist/sdm-pack-DEF @atomist/sdm-pack-GHI

3.  Reinstall Atomist SDM

        $ npm install @atomist/sdm

4.  The consolidation of packages introduces a breaking change: you must
    update your import statements. Specifically:

    -   Change `import … "@atomist/automation-client"` to `import … "@atomist/sdm/lib/client"`
    -   Change `import … "@atomist/sdm-core"` to `import … "@atomist/sdm/lib/core"`
    -   Change `import … "@atomist/sdm-pack-spring"` to `import … "@atomist/sdm/lib/pack/jvm"`
    -   Change `import … "@atomist/sdm-pack-XYZ"` to `import … "@atomist/sdm/lib/pack/XYZ"`

5.  `EditMode` in automation-client is now `editModes.EditMode` in `import { editModes } from "@atomist/sdm/lib/client"`

6.  Some packs that were part of sdm-core have been relocated under
    `sdm/lib/pack`, so their imports change like these:

        import { githubGoalStatusSupport } from "@atomist/sdm/lib/pack/github-goal-status";
        import { goalStateSupport } from "@atomist/sdm/lib/pack/goal-state";
        import { notificationSupport } from "@atomist/sdm/lib/pack/notification";

7.  Deprecated exports have been removed from SDM 2.0. If you need
    help moving away from capabilities that have been removed, please
    [contact us](#support).

[sdm-npm]: https://www.npmjs.com/package/@atomist/sdm

## Contributing

Contributions to this project from community members are encouraged
and appreciated. Please review the [Contributing
Guidelines](CONTRIBUTING.md) for more information. Also see the
[Development](#development) section in this document.

## Code of conduct

This project is governed by the [Code of
Conduct](CODE_OF_CONDUCT.md). You are expected to act in accordance
with this code by participating. Please report any unacceptable
behavior to code-of-conduct@atomist.com.

## Documentation

Please see [docs.atomist.com][atomist-doc] for
[developer][atomist-doc-sdm] documentation.

-   API documentation for this project: [@atomist/sdm TypeDoc][typedoc]
-   List of third-party OSS licenses used in this project: [@atomist/sdm OSS licenses][licenses]

[atomist-doc-sdm]: https://docs.atomist.com/developer/sdm/ "Atomist Documentation - SDM Developer"
[typedoc]: https://atomist.github.io/sdm/ "@atomist/sdm TypeDoc"
[licenses]: legal/THIRD_PARTY.md "@atomist/sdm Third-Party Licenses"

## Connect

Follow [@atomist][atomist-twitter] and [The Composition][atomist-blog]
blog related to SDM.

[atomist-twitter]: https://twitter.com/atomist "Atomist on Twitter"
[atomist-blog]: https://the-composition.com/ "The Composition - The Official Atomist Blog"

## Support

General support questions should be discussed in the `#support`
channel in the [Atomist community Slack workspace][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/sdm/issues

## Development

You will need to install [Node.js][node] to build and test this
project.

[node]: https://nodejs.org/ "Node.js"

### Build and test

Install dependencies.

```
$ npm install
```

Use the `build` package script to compile, test, lint, and build the
documentation.

```
$ npm run build
```

### Release

Releases are handled via the [Atomist SDM][atomist-sdm]. Just press
the 'Approve' button in the Atomist dashboard or Slack.

[atomist-sdm]: https://github.com/atomist/atomist-sdm "Atomist Software Delivery Machine"

---

Created by [Atomist][atomist].
Need Help? [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ "Atomist - Automate All the Software Things"
[slack]: https://join.atomist.com/ "Atomist Community Slack"
