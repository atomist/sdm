# <img src="docs/SDM-Logo-Dark.png" width="26" height="26"> Software Delivery Machine - @atomist/sdm

This is the home of the Software Delivery Machine (SDM) framework and related projects.

The SDM framework enables you to control your delivery process in code. Think of it as an API for your software delivery. See this [introduction](https://docs.atomist.com/) for more information on the concept of a Software Delivery Machine and how to create and develop on an SDM.

## Getting Started

See the [Developer Quick Start](https://docs.atomist.com/quick-start/) to jump straight to creating an SDM.

## Contributing

Contributions to this project from community members are encouraged and appreciated. Please review the [Contributing Guidelines](CONTRIBUTING.md) for more information.

## Code of Conduct

This project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). You are expected to act in accordance with this code by participating. Please report any unacceptable behavior to code-of-conduct@atomist.com.

## Documentation

Please see [docs.atomist.com](https://docs.atomist.com) for [developer](https://docs.atomist.com/developer/sdm/) documentation.

## Connect

Follow [@atomist](https://twitter.com/atomist) and [The Composition](https://the-composition.com) blog related to SDM.

## Support

General support questions should be discussed in the `#support`
channel in the [Atomist community Slack workspace][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/sdm/issues

## Development

You will need to install [node][] to build and test this project.

[node]: https://nodejs.org/ (Node.js)

### Build and test

Use the following package scripts to build, test, and perform other
development tasks.

Command | Reason
------- | ------
`npm install` | install project dependencies
`npm run build` | compile, test, lint, and generate docs
`npm run lint` | run TSLint against the TypeScript
`npm run compile` | generate types from GraphQL and compile TypeScript
`npm test` | run tests
`npm run autotest` | run tests every time a file changes
`npm run clean` | remove files generated during build

### Release

Releases are handled via the [Atomist SDM][atomist-sdm].  Just press
the 'Approve' button in the Atomist dashboard or Slack.

[atomist-sdm]: https://github.com/atomist/atomist-sdm (Atomist Software Delivery Machine)

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ (Atomist - How Teams Deliver Software)
[slack]: https://join.atomist.com/ (Atomist Community Slack)

