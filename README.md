# Local SDM

## Setup
1. Set the `LOCAL_SDM_BASE` environment variable. This will is the directory which is the base for your expanded directory tree. It may contain existing cleaned repos.
2. From the SDM base directory (where you have cloned the project), run `npm install`.
3. Add the Atomist git hook to the existing git projects within this directory structure by running the following command in your SDM base directory:

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

>Running `slalom add-git-hooks` is only necessary for pre-existing cloned directories and directories that are cloned using `git` rather than the local SDM.

## Adding projects
Further projects can be added in two ways:

1. Cloning any git project from anywhere under `$LOCAL_SDM_BASE` and running `slalom add-git-hooks` to add git hooks to it.
2. Running the convenience command to clone a GitHub.com directory in the right place and automatically install the git hook as follows:

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

Only local repos are supported.

## Running Goals


## Running Generators
New projects can be generated as follows:

```
slalom generate --generator=generatorName --owner=spring-team --repo=andromeda --grommit=x

```
The `generator` parameter should be the value of the generator command. The `owner` and `repo` parameters are always required. Individual generators may require additional parameters such as `grommit` in this example, and these may be added using normal CLI option syntax.

## Running Editors
Editors can be run across projects as follows:

```
slalom edit --editor=addThing --owner=spring-team --repos=.*

```
The `editor` parameter should be the value of the editor command. The following parameters are always required:
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
slalom run --command=hello
```
No parameters beyond the command name are required. However, command-specific parameters may be provided in options syntax.


## Roadmap

## Known Bugs
- Autofixes produce error output

### Major Tasks
- Goal preconditions are not respected
- Add [git merge and fetch hooks](https://githooks.com/).
- Depend only on `sdm-api` project. This will require it to be split out and `automation-client` to be split to pull out the Project API, which is part of the SDM API.
- Decide on how to present output to the user.

### Enhancements
- We could pull command metadata and generate CLI completions from it
- `yargs` can export Bash completions
- Only public repos can be cloned at present
