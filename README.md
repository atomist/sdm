# Slalom: Local Software Delivery Machine

A software delivery machine is a program that understands code. You customize it to work with the code 
you care about: fix formatting errors (with commits), perform code reviews, run tests, publish artifacts, etc.

This local software delivery machine responds to your commits, performing whatever actions you decide
should happen in response to new codes.

It also responds to your commands: to create new projects, edit code in existing projects, or other actions
you program into it.

The instructions here will (someday) take you through 
   * initializing your local SDM
   * seeing it react to a push
      * then changing how it reacts to your push
   * creating a new project with a generator
      * then changing it to work from a project of your choice
   * changing code with an editor
      * then making your own code editor
   * running a command
      * then making your own commands

Later, when they've proven useful, you can elevate your push reactions, generators, editors, 
and commands into the cloud for your whole team to use (with Atomist).

## Setup

The SDM works on projects, which are git repositories.

To find projects on your filesystem, the SDM looks in directories group by owner (on GitHub, the owner is an organization
or user; on BitBucket, the owner is a user or a BitBucket Project), and it looks for each owner directory
 under one parent directory.

The directory structure looks like this:

```
SDM_PROJECTS_ROOT
├── owner1
│   ├── repo1
│   └── repo2
└── owner2
    ├── repo3
    └── repo4

``` 

### Environment
Set the `SDM_PROJECTS_ROOT` environment variable. This is the directory which is the base for your expanded directory 
tree. This can be an empty directory, or a directory with some repositories in it, grouped by owner as described above.

### Download and install

Clone this project.

From the SDM base directory (where you have cloned the project), run the following commands:

```
npm install
npm run build
npm link
```

First, `npm install` brings down this project's dependencies.
Then, `npm run build` compiles the TypeScript into JavaScript.
Finally, `npm link` makes this project's cli tool, `slalom`, available globally.

### Configure Existing Projects

If you already have repositories cloned under your $SDM_PROJECTS_ROOT, configure them to activate the local SDM
on commit.

Add the Atomist git hook to the existing git projects within this directory structure by 
running the following command:

```
slalom add-git-hooks
```

Success will result in output like the following:

```==> slalom add-git-hooks
2018-06-06T11:23:58.003Z [m:85087] [info ] Adding extension pack 'WellKnownGoals' version 0.1.0 from Atomist
2018-06-06T11:23:58.051Z [m:85087] [info ] Searching under child directory [spring-team] of /Users/rodjohnson/temp/local-sdm
2018-06-06T11:23:58.052Z [m:85087] [info ] Searching under child directory [undefined] of /Users/rodjohnson/temp/local-sdm
2018-06-06T11:23:58.053Z [m:85087] [info ] Searching under child directory [x] of /Users/rodjohnson/temp/local-sdm
2018-06-06T11:23:58.074Z [m:85087] [info ] addGitHooks: Adding git post-commit script to project at /Users/rodjohnson/temp/local-sdm/spring-team/danger-mouse
2018-06-06T11:23:58.076Z [m:85087] [info ] addGitHooks: Adding git post-commit script to project at /Users/rodjohnson/temp/local-sdm/spring-team/fiddlesticks
2018-06-06T11:23:58.077Z [m:85087] [info ] addGitHooks: Adding git post-commit script to project at /Users/rodjohnson/temp/local-sdm/spring-team/foo
2018-06-06T11:23:58.078Z [m:85087] [info ] addGitHooks: Adding git post-commit script to project at /Users/rodjohnson/temp/local-sdm/spring-team/losgatos1
2018-06-06T11:23:58.079Z [m:85087] [info ] addGitHooks: Adding git post-commit script to project at /Users/rodjohnson/temp/local-sdm/spring-team/spring-rest-seed
2018-06-06T11:23:58.080Z [m:85087] [info ] addGitHooks: Adding git post-commit script to project at /Users/rodjohnson/temp/local-sdm/x/y
```

> Running `slalom add-git-hooks` is only necessary for pre-existing cloned directories and directories that are cloned using `git` rather than the local SDM.

## Reacting to commits

A software delivery machine reacts to code changes. For instance, when you commit to a Spring Boot application, it can 
start the app up locally, while running tests.
When you commit to a Node library, it can publish a snapshot to npm, while running tests, and while fixing any formatting
errors and performing automated code review and identifying sensitive changes.

Make a commit in any repository within $SDM_PROJECTS_ROOT, and the SDM will run immediately. 

Commits to managed repos generate Atomist *push* events.

# Adding to your SDM

The `configure` function in `src/configure.ts` sets up your SDM. Add listeners, 
editors, generators and other commands here. The present implementation shows some 
basic functionality.

> The API is identical to the API of a cloud-connected Atomist SDM.

## Adding projects
Further projects can be added in three ways:

### Normal git Clone

Cloning any git project from anywhere under `$SDM_PROJECTS_BASE` and running `slalom add-git-hooks` to add git hooks to it.

### Symbolic Link
Go to the correct organization directory, creating it if necessary. Then create a symlink to the required directory elsewhere on your machine. For example:

```
ln -s /Users/rodjohnson/sforzando-dev/idea-projects/flight1
```
Then run `slalom add-git-hooks` and the linked project will be treatd as a normal project.

### Import Command

The easiest way to add an existing project to your SDM projects is: run the `import` command to clone a 
GitHub.com repository in the right place in the expanded tree and automatically
 install the git hook:

```
slalom import --owner=johnsonr --repo=initializr

```

Output will look as follows:

```
018-06-06T11:27:27.068Z [m:85220] [info ] Adding extension pack 'WellKnownGoals' version 0.1.0 from Atomist
2018-06-06T11:27:27.116Z [m:85220] [info ] Adding GitHub project johnsonr/initializr
Cloning into 'initializr'...
warning: redirecting to https://github.com/johnsonr/initializr/
2018-06-06T11:27:33.349Z [m:85220] [info ] addGitHooks: Adding git post-commit script to project at /Users/rodjohnson/temp/local-sdm/johnsonr/initializr
```

Only public repos are supported.

## Running Generators

New projects can be generated as follows:

```
slalom generate generatorName --owner=spring-team --repo=andromeda --grommit=x

```
The first positional parameter after `generate` should be the value of the generator command. 
The `owner` and `repo` parameters are always required. 
Individual generators may require additional parameters such as `grommit` in this example, 
and these may be added using normal CLI option syntax.

## Running Editors

Editors can be run across projects as follows:

```
slalom edit addThing --owner=spring-team --repos=.*
```

The first positional parameter after `edit` should be the name of the editor command.

If you're in a repository directory under $SDM_PROJECTS_ROOT, the editor will run on that repository.
Or, you can supply an owner and a repository -- or better, a regular expression! Then the editor will run on
all $SDM_PROJECTS_ROOT/owner/repository directories that match the expression.
 
You can always supply these parameters:
- `owner`: Organization to which the repos to be edited belong
- `repos`: Regular expression matching the repos to be edited within that organization.

As with editors, there may be additional, editor-specific parameters.

Edits will be presented as branches within the edited repo. The editor output will list the branches as follows:

```
018-06-06T11:32:34.216Z [m:85438] [info ] Pull request [addThing] on spring-team:fiddlesticks
To file:///Users/rodjohnson/temp/local-sdm/spring-team/spring-rest-seed
 * [new branch]      atomist/edit-addThing-1528284753309 -> atomist/edit-addThing-1528284753309
2018-06-06T11:32:34.274Z [m:85438] [info ] Pull request [addThing] on spring-team:spring-rest-seed
```

## Running Commands

```
slalom run hello
```
No parameters beyond the command name are required. However, command-specific parameters may be provided in options syntax.

## Advanced Setup

### Mapped Parameters and Secrets
Environment variables

- `SLACK_TEAM`
- `SLACK_USER_NAME`


## Roadmap

## Known Bugs
- Autofixes produce error output

### Major Tasks
Urgent:

- Goal preconditions are not respected
- Add [git merge and fetch hooks](https://githooks.com/).
- Mapped parameters and secrets should be sourced from the environment if not provided

Less urgent:

- Depend only on `sdm-api` project. This will require it to be split out and `automation-client` to be split to pull out the Project API, which is part of the SDM API.
- Decide on how to present output to the user, especially actionable output
- Decide how to get build results from external tools in (if we wish to)

### Enhancements
- We could pull command metadata and generate CLI completions from it at the time when we initialize `yargs`. This would require generators and editors to be tagged.
- `yargs` can export Bash completions
- Only public repos can be cloned at present
