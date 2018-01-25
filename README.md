# @atomist/event-handler

This repository contains the commit event automation example described
in [Custom Slack Notifications with Atomist Event Handlers][blog].
This example demonstrates use of the [Atomist][atomist] API via
the [`@atomist/automation-client`][client] node module.

[blog]: https://the-composition.com/extending-your-slack-bot-part-2-events-6f2822c5eb6a
[client]: https://github.com/atomist/automation-client-ts (@atomist/automation-client Node Module)

## Prerequisites

### Enroll the Atomist bot in your Slack team

<p align="center">
  <img alt="Add to Slack" height="50" width="174" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" />
</p>

### Node.js

You will need to have [Node.js][node] installed.  To verify that the
right versions are installed, please run:

```
$ node -v
v8.4.0
$ npm -v
5.4.1
```

[node]: https://nodejs.org/ (Node.js)

### Cloning the repository and installing dependencies

To get started run the following commands to clone the project,
install its dependencies, and build the project:

```
$ git clone git@github.com:atomist-blogs/event-handler.git
$ cd event-handler
$ npm install
$ npm run build
```

### Configuring your environment

If this is the first time you will be running an Atomist API client
locally, you should first configure your system using the
`atomist-config` script:

```
$ `npm bin`/atomist-config [SLACK_TEAM_ID]
```

The script does two things: records what Slack team you want your
automations running in and creates
a [GitHub personal access token][token] with "read:org" scope.

You must run the automations in a Slack team of which you are a
member.  You can get your Slack team ID by typing `team` in a DM to
the Atomist Bot.  If you do not supply the Slack team ID on the
command line, the script will prompt you to enter it.

The `atomist-config` script will prompt you for your GitHub
credentials.  It needs them to create the GitHub personal access
token.  Atomist does not store your credentials and only writes the
token to your local machine.

The Atomist API client sends GitHub personal access token when
connecting to the Atomist API.  The Atomist API will use the token to
confirm you are who you say you are and are in a GitHub org connected
to the Slack team in which you are running the automations.

[token]: https://github.com/settings/tokens (GitHub Personal Access Tokens)

## Starting up the automation-client

To start the client, run the following command:

```
$ npm run autostart
```

## See Event Automation in Action

To see the event automation in action, you should make a commit in a
repository that is linked to a Slack channel.  The commit message
should include the word "Crushed" followed by a reference to an issue
in the form `#N`, replacing `N` with the number of the issue.  Once
you push that commit, the bot should message you letting you know you
crushed it!

## Support

General support questions should be discussed in the `#support`
channel in our community Slack team
at [atomist-community.slack.com][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/event-handler/issues

## Development

You will need to install [node][] to build and test this project.

### Build and Test

Command | Description
------- | ------
`npm install` | to install all the required packages
`npm start` | to start the Atomist automation client
`npm run autostart` | run the client, refreshing when files change
`npm run lint` | to run tslint against the TypeScript
`npm run compile` | to compile all TypeScript into JavaScript
`npm test` | to run tests and ensure everything is working
`npm run autotest` | run tests continuously
`npm run clean` | remove stray compiled JavaScript files and build directory

### Release

To create a new release of the project, simply push a tag of the form
`M.N.P` where `M`, `N`, and `P` are integers that form the next
appropriate [semantic version][semver] for release.  The version in
the package.json must match the tag.  For example:

[semver]: http://semver.org

```
$ git tag -a 1.2.3
$ git push --tags
```

The Travis CI build (see badge at the top of this page) will publish
the NPM module and automatically create a GitHub release using the tag
name for the release and the comment provided on the annotated tag as
the contents of the release notes.

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack team][slack].

[atomist]: https://www.atomist.com/
[slack]: https://join.atomist.com
