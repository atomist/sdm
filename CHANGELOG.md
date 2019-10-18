# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/sdm/compare/1.7.0...HEAD)

### Added

-   Fix signature. [#777](https://github.com/atomist/sdm/issues/777)

### Changed

-   Make output less verbose during development. [#772](https://github.com/atomist/sdm/issues/772)
-   Switch to globby for glob matching. [#775](https://github.com/atomist/sdm/issues/775)

### Fixed

-   Correct interface for spawnCodeTransform. [#770](https://github.com/atomist/sdm/issues/770)
-   Resolves #669. [#773](https://github.com/atomist/sdm/issues/773)

## [1.7.0](https://github.com/atomist/sdm/compare/1.6.1...1.7.0) - 2019-09-09

### Added

-   Update GeneratorRegistration Interface for AfterActions. [#758](https://github.com/atomist/sdm/issues/758)
-   Add concurrentTasks to createJob. [bb21ac6](https://github.com/atomist/sdm/commit/bb21ac650148fe340d1310a0ab75bd61a1aa49ce)
-   Single repo operations as jobs. [1b87048](https://github.com/atomist/sdm/commit/1b87048dad545a16d62d4e512c31972c13bc69fc)
-   Fail Goals after timeout . [#681](https://github.com/atomist/sdm/issues/681)

### Changed

-   Allow to disable code transform messages. [a517d2b](https://github.com/atomist/sdm/commit/a517d2b778579fb3584ac1d60c571c9043e5e0b2)
-   Upgrade to graphql-codegen version 1.7.1. [#768](https://github.com/atomist/sdm/issues/768)

### Fixed

-   Queue goal doesn't start when canceling a single goal set. [#727](https://github.com/atomist/sdm/issues/727)
-   Fix no parameters issue with createJob. [#759](https://github.com/atomist/sdm/issues/759)
-   `promptFor` not sending continuation message in cluster mode. [#765](https://github.com/atomist/sdm/issues/765)
-   Include mapped parameters when sending continuation message. [af0729d](https://github.com/atomist/sdm/commit/af0729dd994cc201891f623884cdda04ace3cec1)

## [1.6.1](https://github.com/atomist/sdm/compare/1.6.0...1.6.1) - 2019-07-11

### Changed

-   Update automation-client and lodash. [82b3dd3](https://github.com/atomist/sdm/commit/82b3dd39fae094838a404e6820fd249ddc936a39)

## [1.6.0](https://github.com/atomist/sdm/compare/1.5.1...1.6.0) - 2019-07-09

### Added

-   Move code transforms to job support. [#756](https://github.com/atomist/sdm/issues/756)

### Deprecated

-   Deprecate Fingerprint goal. [4e894f9](https://github.com/atomist/sdm/commit/4e894f9f53e79e3e0f8fd8b868c7f17bf0f05a21)

### Fixed

-   `ProgressLog` is not populated for code transforms. [#745](https://github.com/atomist/sdm/issues/745)

## [1.5.1](https://github.com/atomist/sdm/compare/1.5.0...1.5.1) - 2019-06-04

### Changed

-   Update deps. [4adc725](https://github.com/atomist/sdm/commit/4adc72558d6164ea6bb0dd2ffb433f4e3bdda1c6)
-   Reduce the log noise in error cases.  [a90e5cf](https://github.com/atomist/sdm/commit/a90e5cf06a1c059d0614e76118070e9077de028a)
-   Remove usage of externalKey in log. [760cedf](https://github.com/atomist/sdm/commit/760cedfce2827c0176502291b7aff671fb839367)

### Fixed

-   Add missing array destructuring. [74704ac](https://github.com/atomist/sdm/commit/74704ac1fc30b57ab9cb63b37070806df1fcac38)
-   Skip sprintf if no args are given. [e4c6410](https://github.com/atomist/sdm/commit/e4c6410899f6bb23d31678e17355ead87aa09c98)
-   Fix typing on Autofix goal. [ea2ce5c](https://github.com/atomist/sdm/commit/ea2ce5cd3e0dc0b7cf940bed8e974c0405387aed)

## [1.5.0](https://github.com/atomist/sdm/compare/1.4.1...1.5.0) - 2019-05-27

### Added

-   Allow command name in actionableButton and menu. [cc3f07a](https://github.com/atomist/sdm/commit/cc3f07a4a414f111e99c772aed728397b1abe0ab)
-   Retry options for FulfillableGoal. [#700](https://github.com/atomist/sdm/issues/700)
-   Add abrtitary string to allowed scopes for prefs. [dda2232](https://github.com/atomist/sdm/commit/dda2232eaf8631a75ba6d8526e4854f8f91d1f71)
-   Catch error from running code transform. [e880e41](https://github.com/atomist/sdm/commit/e880e415636b41da9e4816a5418c5fd471a642b0)
-   Allow control over transformPresentation with autofix. [#687](https://github.com/atomist/sdm/issues/687)
-   Allow `afterActions` on generator registrations. [#714](https://github.com/atomist/sdm/issues/714)
-   Change `Applying Autofix` to `Evaluating Autofix` (or similar). [#719](https://github.com/atomist/sdm/issues/719)
-   Don't stop auto fix goal when transformPresentation is to a different branch. [#725](https://github.com/atomist/sdm/issues/725)
-   Add and & or to aggregate PushTests. [a928fdb](https://github.com/atomist/sdm/commit/a928fdb3f9caf2e4eb616f2158b62837de990ec6)
-   Add adapt functionality from decorator handlers. [8068ee5](https://github.com/atomist/sdm/commit/8068ee5bce9b0d8bbe75aeeea7a6334e5aee3851)
-   Add support for reading project configuration from a yaml file. [#733](https://github.com/atomist/sdm/issues/733)
-   Add progressLog to CodeInspection and CodeTransform. [#737](https://github.com/atomist/sdm/issues/737)
-   Set commit author on autofixes. [fcd10b8](https://github.com/atomist/sdm/commit/fcd10b8c154fc6aa965c83e6c323837d83b49c0e)
-   Improvements to message sending protocol . [#741](https://github.com/atomist/sdm/issues/741)
-   Support printf style write method on `ProgressLog`. [#263](https://github.com/atomist/sdm/issues/263)

### Changed

-   **BREAKING** Clean up push impact invocation. [#703](https://github.com/atomist/sdm/issues/703)
-   Remove .\* repos default from BitBucketRepoTargets. [2f1fd7a](https://github.com/atomist/sdm/commit/2f1fd7a03b3eb5d38fed455c92abb0dcb46be603)
-   Rolar log url should use uniqueName not name to avoid collision. [#710](https://github.com/atomist/sdm/issues/710)
-   Deprecate deployers. [#734](https://github.com/atomist/sdm/issues/734)

### Deprecated

-   Session ID being used as Bearer in Authorization header. [#689](https://github.com/atomist/sdm/issues/689)
-   Deprecate deployers. [#734](https://github.com/atomist/sdm/issues/734)

### Fixed

-   Pass context to project loader for code inspections. [80d367b](https://github.com/atomist/sdm/commit/80d367b1673966056b5aeba5c8c6a9480406c10d)
-   Make setGoalsWhen respect enclosing PushTest. [#708](https://github.com/atomist/sdm/issues/708)
-   Use correct base branch for raising autofix PRs. [ff68974](https://github.com/atomist/sdm/commit/ff68974e07d4d73b9ac8ebff126646bd461205e5)
-   `FulfillmentCallbacks` aren't running on goals without pre conditions. [#701](https://github.com/atomist/sdm/issues/701)
-   When a GoalExecutionListener fails, the goal stays in progress. [#739](https://github.com/atomist/sdm/issues/739)
-   ExecuteGoalResult from a ProjectListener is not persisted. [#738](https://github.com/atomist/sdm/issues/738)

## [1.4.1](https://github.com/atomist/sdm/compare/1.4.0...1.4.1) - 2019-04-01

### Fixed

-   Fix ChildProcessOnProject interface. [903693d](https://github.com/atomist/sdm/commit/903693d050100681a854ca47b1c272a7390f3f7e)

## [1.4.0](https://github.com/atomist/sdm/compare/1.3.0...1.4.0) - 2019-04-01

### Added

-   Provide the URL to the local SDM so it can give instructions. [#690](https://github.com/atomist/sdm/issues/690)
-   Add project-aware goal invocation converter. [#697](https://github.com/atomist/sdm/issues/697)

### Changed

-   Default formatDate to UTC. [#695](https://github.com/atomist/sdm/issues/695)

### Fixed

-   GitHub lazy project loader honors branch. [72d0b02](https://github.com/atomist/sdm/commit/72d0b02add2652390bcb2021bd83a67fa64aaa3a)

## [1.3.0](https://github.com/atomist/sdm/compare/1.2.0...1.3.0) - 2019-03-14

### Added

-   Make full clone an option on CodeInspection Goal. [#643](https://github.com/atomist/sdm/issues/643)
-   Add mergeOptions method. [939c04c](https://github.com/atomist/sdm/commit/939c04cf28114c42808712d3246645d0ab4bb96f)
-   Stream files during code transform. [#585](https://github.com/atomist/sdm/issues/585)
-   Add PreferenceStore interface. [#658](https://github.com/atomist/sdm/issues/658)
-   Add services to a FulfillableGoal. [e5e09df](https://github.com/atomist/sdm/commit/e5e09df8ed5ed1290620ec47466e53767de47b1f)
-   Add branchAwareCodeTransform to make it target branch aware. [#659](https://github.com/atomist/sdm/issues/659)
-   Support parameter prompting from command listeners. [#661](https://github.com/atomist/sdm/issues/661)
-   Support @Value in parameter declaration . [#648](https://github.com/atomist/sdm/issues/648)
-   Enhance the typedoc within CodeTransformRegistration. [#665](https://github.com/atomist/sdm/issues/665)
-   Add parameters to EventHandlerRegistration. [230db78](https://github.com/atomist/sdm/commit/230db78e37e669ea8065b0ee5bc788e58f9cf117)
-   Provide a useful implementation of onTransformResults. [#666](https://github.com/atomist/sdm/issues/666)
-   Add conditional command registration. [#676](https://github.com/atomist/sdm/issues/676)
-   Introduce goal signing and verification. [#678](https://github.com/atomist/sdm/issues/678)
-   Add types that help you specify what your Configuration is. [#679](https://github.com/atomist/sdm/issues/679)
-   Adds Gitlab repo targets for commands. [#683](https://github.com/atomist/sdm/issues/683)

### Changed

-   Populate the SHA on projects when loading them. [#652](https://github.com/atomist/sdm/issues/652)
-   Make goal scheduling more plugable. [#656](https://github.com/atomist/sdm/issues/656)
-   Make LogSuppressor the default for logInterpreter. [6a921e2](https://github.com/atomist/sdm/commit/6a921e2c488f57fe544e5d4bcfa72885b3825423)
-   Deprecate lower case enum values. [f556259](https://github.com/atomist/sdm/commit/f5562590f51caaaa3c97340b31efe544ea71bcc6)
-   Improve startingPoint handling in generators. [#663](https://github.com/atomist/sdm/issues/663)
-   Deprecate paramsMaker. [#667](https://github.com/atomist/sdm/issues/667)
-   Accept extensions starting with . in isMaterialChange. [#674](https://github.com/atomist/sdm/issues/674)

### Deprecated

-   Deprecated `createGoal()`. [8b27e81](https://github.com/atomist/sdm/commit/8b27e811de1bd76f538e6b311256da939904af97)
-   Deprecate lower case enum values. [f556259](https://github.com/atomist/sdm/commit/f5562590f51caaaa3c97340b31efe544ea71bcc6)
-   Deprecate paramsMaker. [#667](https://github.com/atomist/sdm/issues/667)
-   ChainTransforms swallows exceptions. [#668](https://github.com/atomist/sdm/issues/668)
-   Add parameters to EventHandlerRegistration. [230db78](https://github.com/atomist/sdm/commit/230db78e37e669ea8065b0ee5bc788e58f9cf117)

### Removed

-   Remove atomist webhook handling from generators. [498bc1c](https://github.com/atomist/sdm/commit/498bc1c3f0c5c3b4c4fe970ad503c41611e33462)

### Fixed

-   Errors in machine function can get swallowed and ignored. [#654](https://github.com/atomist/sdm/issues/654)
-   Make lazy project loader work for generators. [2e0ed3e](https://github.com/atomist/sdm/commit/2e0ed3ec205237b4d28d0b78eb93e3cc60e83657)
-   Do not swallow exceptions thrown by transforms in generators. [#664](https://github.com/atomist/sdm/issues/664)
-   ChainTransforms swallows exceptions. [#668](https://github.com/atomist/sdm/issues/668)

## [1.2.0](https://github.com/atomist/sdm/compare/1.1.0...1.2.0) - 2018-12-27

### Added

-   Allow more options to be passed to createGoal. [ab89243](https://github.com/atomist/sdm/commit/ab89243dd074ce4a1cb86ceab1be8e860b16e667)
-   Add dryRun flag to CodeTransform invocations. [#613](https://github.com/atomist/sdm/issues/613)
-   Add helpers for `doWithRepos` and `doWithProject`. [#615](https://github.com/atomist/sdm/issues/615)
-   Provide spawnLog with consistent spawn interface. [#620](https://github.com/atomist/sdm/issues/620)
-   Add exec and spawn to doWithProject callback. [#618](https://github.com/atomist/sdm/issues/618)
-   Add goal function to create a new GoalWithFulfillment. [311a273](https://github.com/atomist/sdm/commit/311a273f651be8c6aa5baa3d1a0a6c415973d52d)
-   Allow to register `GoalExecutionListener` on a `GoalWithFulfillment`. [#624](https://github.com/atomist/sdm/issues/624)
-   Allow state computation in push rule evaluation. [#630](https://github.com/atomist/sdm/issues/630)
-   Add actionableMenu to create menus from CommandHandlerRegistrations. [9ddfe18](https://github.com/atomist/sdm/commit/9ddfe18181832c8b49a2443e190a4a6179d3966e)
-   Provide useful error messages when project generation fails. [#634](https://github.com/atomist/sdm/issues/634)
-   Add `targets.branch` to `CodeTransform` targeting. [#636](https://github.com/atomist/sdm/issues/636)
-   Add ability to select goal based on push in DSL. [#642](https://github.com/atomist/sdm/issues/642)

### Changed

-   **BREAKING** Introduce LazyProjectLoader and LazyProject interfaces. [#625](https://github.com/atomist/sdm/issues/625)
-   Don’t abort code transform on many repos if one repo fails. [#626](https://github.com/atomist/sdm/issues/626)
-   Rename enrichInvocation to attachFact. [#632](https://github.com/atomist/sdm/issues/632)
-   Stronger typing on actionable(Command|Menu). [1a3e3e2](https://github.com/atomist/sdm/commit/1a3e3e2cbe3b1bf2e97d5e1db6f59c2f39414925)
-   Change default code transform branch name to use proper date. [87a5514](https://github.com/atomist/sdm/commit/87a5514e89256c5214ed4b650ad8ad027ec5da2b)

### Deprecated

-   Deprecate sdmGoal on GoalInvocation. [dbb25d2](https://github.com/atomist/sdm/commit/dbb25d2d020fc946450edd71e4e0465cd3e1af43)

### Removed

-   Remove old Builder interface; moved to sdm-pack-build. [6211aef](https://github.com/atomist/sdm/commit/6211aef5f19a181d4d3a3f13210de3998c29a767)

### Fixed

-   Execute startupListeners before scheduling the triggered listeners. [#611](https://github.com/atomist/sdm/issues/611)
-   Using `createGoal` with space in `displayName` creates invalid `uniqueName`. [#623](https://github.com/atomist/sdm/issues/623)
-   Fix issues when pushTest is missing on project listener. [7fd6fab](https://github.com/atomist/sdm/commit/7fd6fab1b043d587ea2d551eb955782f719003bb)
-   Update doc on goal execution listener. [#639](https://github.com/atomist/sdm/issues/639)

## [1.1.0](https://github.com/atomist/sdm/compare/1.0.1...1.1.0) - 2018-12-08

### Added

-   Add support for canceling goals. [#572](https://github.com/atomist/sdm/issues/572)
-   Add review listeners that set goal result state. [#573](https://github.com/atomist/sdm/issues/573)
-   Fingerprints do not support deployments to staging. [#579](https://github.com/atomist/sdm/issues/579)
-   Update child_process usage. [#584](https://github.com/atomist/sdm/issues/584)
-   CommandHandlerRegistrations supporting hints for "autoSubmit". [#577](https://github.com/atomist/sdm/issues/577)
-   Add support for trigger listeners. [#595](https://github.com/atomist/sdm/issues/595)
-   Add `Queue` goal to queue goal sets. [#597](https://github.com/atomist/sdm/issues/597)

### Changed

-   Make `code` on `ExecuteGoalResult` optional. [#586](https://github.com/atomist/sdm/issues/586)
-   Polishing: use readonly arrays. [#591](https://github.com/atomist/sdm/issues/591)
-   Run PushMappings sequentially. [#594](https://github.com/atomist/sdm/issues/594)

### Deprecated

-   Update child_process usage. [#584](https://github.com/atomist/sdm/issues/584)

### Fixed

-   Configuration Validation Issue. [#578](https://github.com/atomist/sdm/issues/578)

## [1.0.1](https://github.com/atomist/sdm/compare/1.0.0-RC.2...1.0.1) - 2018-11-09

### Added

-   Add WellKnownGoals. [#566](https://github.com/atomist/sdm/issues/566)
-   Expose push to inspection and autofixes and remove broken considerOnlyChangedFiles option. [#568](https://github.com/atomist/sdm/issues/568)
-   Add decision manager to decide on final approval vote. [68ff03e](https://github.com/atomist/sdm/commit/68ff03e49e8476537aed382a3cf6a6c5f9b57d57)
-   Add slackQuestionMessage. [1cb71e2](https://github.com/atomist/sdm/commit/1cb71e29eebfcaa2942571966502c7c10c70d2bd)
-   Allow to disable sending of review errors to slack. [04da438](https://github.com/atomist/sdm/commit/04da4386bb1c15bd83b482321ae67fc3a615d9bd)
-   Map SdmGoals to Goals for custom descriptions, without hard-coding a list. [#294](https://github.com/atomist/sdm/issues/294)

### Changed

-   **BREAKING** Remove `considerOnlyChangedFiles` setting on autofix and inspection registrations. This should be handled specific registrations. [#568](https://github.com/atomist/sdm/issues/568)
-   Add externalUrls on ExecuteGoalResult and deperate targetUrls. [687a9ed](https://github.com/atomist/sdm/commit/687a9edb96e402202a212f5f55442e4eed008110)
-   Replace `Promise<any>` with `Promise<void>`. [#570](https://github.com/atomist/sdm/issues/570)

## [1.0.0-RC.2](https://github.com/atomist/sdm/compare/1.0.0-RC.1...1.0.0-RC.2) - 2018-10-30

### Added

-   Reading projectConfigurationValue falls back to SDM config. [49d928a](https://github.com/atomist/sdm/commit/49d928a5e1fa57d3e0e0fe22afcad5ebcf3a521c)
-   Add convenience goal project listeners for after and before. [4b8ab7e](https://github.com/atomist/sdm/commit/4b8ab7ef410d2965377f52ea9bde23314639d3ef)
-   Add `setNoMoreGoals` to push rule DSL
-   Add ability to run through entire GoalSets without causing side effects. [#551](https://github.com/atomist/sdm/issues/551)
-   Add fetchGoalsFromPush method to read goals from subscription. [#559](https://github.com/atomist/sdm/issues/559)
-   Store multiple external urls per goal with link and label. [#557](https://github.com/atomist/sdm/issues/557)
-   Add version number to SdmGoal and use in compositeId instead of ts. [#552](https://github.com/atomist/sdm/issues/552)
-   Add createPredicatedGoal. [#560](https://github.com/atomist/sdm/issues/560)
-   Expose structure of push tests and push rules. [#558](https://github.com/atomist/sdm/issues/558)
-   Add commit-images link to GraphQL. [#561](https://github.com/atomist/sdm/issues/561)

### Fixed

-   Set goal state command doesn't get goals for multiple goal sets correct. [#563](https://github.com/atomist/sdm/issues/563)

## [1.0.0-RC.1](https://github.com/atomist/sdm/compare/1.0.0-M.5...1.0.0-RC.1) - 2018-10-15

### Added

-   Add tags to ExtensionPack metadata. [#543](https://github.com/atomist/sdm/issues/543)

### Removed

-   **BREAKING** Remove well known goals. [#541](https://github.com/atomist/sdm/issues/541)
-   **BREAKING** Remove SDM-level goal methods. [#545](https://github.com/atomist/sdm/issues/545)
-   **BREAKING** Remove old style registration methods. [#546](https://github.com/atomist/sdm/issues/546)
-   **BREAKING** Remove client exports from SDM. [#547](https://github.com/atomist/sdm/issues/547)

### Fixed

-   For finding changes in the push, use the list of commits and not `before`. [#293](https://github.com/atomist/sdm/issues/293)

## [1.0.0-M.5](https://github.com/atomist/sdm/compare/1.0.0-M.4...1.0.0-M.5) - 2018-09-26

### Added

-   New states for stopped and canceled goals. [#533](https://github.com/atomist/sdm/pull/533)
-   **BREAKING** Test. [#534](https://github.com/atomist/sdm/issues/534)
-   Support code level project listeners. [#536](https://github.com/atomist/sdm/issues/536)
-   Add pre-approval states for goals. [#537](https://github.com/atomist/sdm/issues/537)

### Changed

-   Make environment optional on GoalDefinition. [#530](https://github.com/atomist/sdm/issues/530)
-   ExecuteGoalResult should not extend HandlerResult. [#469](https://github.com/atomist/sdm/issues/469)

### Deprecated

-   Typo: getGoalDefintionFrom. [#529](https://github.com/atomist/sdm/issues/529)

### Fixed

-   Typo: getGoalDefintionFrom. [#529](https://github.com/atomist/sdm/issues/529)

## [1.0.0-M.4](https://github.com/atomist/sdm/compare/1.0.0-M.3...1.0.0-M.4) - 2018-09-16

### Added

-   Prepare to hook in client startup events. [#520](https://github.com/atomist/sdm/issues/520)

### Changed

-   When a new-style goal has no implementation, fail it. [#512](https://github.com/atomist/sdm/issues/512)
-   Fingerprint listeners should get all of the fingerprints delivered to…. [#519](https://github.com/atomist/sdm/issues/519)

### Deprecated

-   **BREAKING** Deprecate per SDM methods related to specific goals. [#518](https://github.com/atomist/sdm/issues/518)

### Fixed

-   No such file or directory `~/.atomist.log`. [#514](https://github.com/atomist/sdm/issues/514)
-   Pass depth down to `git clone` in order to correctly diff the changes. [#513](https://github.com/atomist/sdm/issues/513)

## [1.0.0-M.3](https://github.com/atomist/sdm/compare/1.0.0-M.1...1.0.0-M.3) - 2018-09-04

### Added

-   Added `EnforceableProjectInvariantRegistration`.
-   Added `AutoInspectRegistration`.
-   Register shutdown hooks to clean up cloned directories. [#494](https://github.com/atomist/sdm/issues/494)
-   Allow to set description from a `ExecuteGoal`. [#1d18bf9](https://github.com/atomist/sdm/commit/1d18bf9a7da13a103d5364b4d5edb5aec6bb10c5)
-   Add `IsPushToPullRequest` push test. [#496](https://github.com/atomist/sdm/issues/496)
-   Add reason to a goal approval vote. [#eaf2f60](https://github.com/atomist/sdm/commit/eaf2f60cecc51f2b8c057307397721f7d3c0cb96)
-   Allow goals to receive implementations and listeners. [#504](https://github.com/atomist/sdm/issues/504)
-   Starting point should be able to handle a Promise returning function. [#500](https://github.com/atomist/sdm/issues/500)
-   Add typed `Build` goal to register `Builder` instances. [#506](https://github.com/atomist/sdm/issues/506)
-   Goal names are now automatically generated based on source code location. [#507](https://github.com/atomist/sdm/issues/507)

### Changed

-   **BREAKING** `AutofixRegistration.parameters` method renamed to `parametersInstance`.
-   **BREAKING** `CodeTransformRegistration.react` method renamed to `onTransformResults`.
-   **BREAKING** `CodeInspectionRegistration.react` method renamed to `onInspectionResults`.
-   **BREAKING** `ReviewerRegistration.action` renamed `inspect`.
-   **BREAKING** Rename `ReviewGoal` -> \`CodeInspectionGoal. [#e30b6c1](https://github.com/atomist/sdm/commit/e30b6c15ffc3b35bf1fc09cd822f9a6fee1ee5a6)
-   **BREAKING** Evaluate pushTest when selecting goal implementations. [#493](https://github.com/atomist/sdm/issues/493)
-   **BREAKING** `addNewRepoWithCodeListener` renamed `addFirstPushListener`.
-   Push tests for adding a goal implementation are not run. [#490](https://github.com/atomist/sdm/issues/490)
-   Transform-testNaming. [#502](https://github.com/atomist/sdm/issues/502)
-   **BREAKING** Remove unimplemented property observesOnly. [#501](https://github.com/atomist/sdm/issues/501)
-   **BREAKING** No longer export `EditResult`. Use `TransformResult`
-   `CodeTransform` functions no longer need to return `Project` or `TransformResult`

### Fixed

-   Fix incorrect print statement. [#497](https://github.com/atomist/sdm/issues/497)
-   SDM doesn't start with 1.0.0-M.1. [#495](https://github.com/atomist/sdm/issues/495)

## [1.0.0-M.1](https://github.com/atomist/sdm/compare/0.4.8...1.0.0-M.1) - 2018-08-27

### Changed

-   Prepare for 1.0.0 release.

## [0.4.8](https://github.com/atomist/sdm/compare/0.4.7...0.4.8) - 2018-08-27

### Added

-   Specific logging on cleanup of cached project. [#483](https://github.com/atomist/sdm/issues/483)

## [0.4.7](https://github.com/atomist/sdm/compare/0.4.6...0.4.7) - 2018-08-24

## [0.4.6](https://github.com/atomist/sdm/compare/0.4.5...0.4.6) - 2018-08-24

## [0.4.5](https://github.com/atomist/sdm/compare/0.4.4...0.4.5) - 2018-08-23

## [0.4.4](https://github.com/atomist/sdm/compare/0.4.3...0.4.4) - 2018-08-22

### Fixed

-   CachingProjectLoader doesn’t clean file system resources. [#482](https://github.com/atomist/sdm/issues/482)

## [0.4.3](https://github.com/atomist/sdm/compare/0.4.2...0.4.3) - 2018-08-21

## [0.4.2](https://github.com/atomist/sdm/compare/0.4.1...0.4.2) - 2018-08-17

## [0.4.1](https://github.com/atomist/sdm/compare/0.4.0...0.4.1) - 2018-08-09

### Added

-   By default, address channels on a transform. [#474](https://github.com/atomist/sdm/issues/474)
-   Key types from `automation-client` are now exported by this module, which serves as the main Atomist API.

### Changed

-   Fixed name of OnIssueAction GraphQL subscription.

### Deprecated

-   OnNewIssue GraphQL subscription.

## [0.4.0](https://github.com/atomist/sdm/compare/0.3.1...0.4.0) - 2018-08-07

### Added

-   Add paging for goals. [#436](https://github.com/atomist/sdm/issues/436)
-   Add DSL for creating Goals. [#437](https://github.com/atomist/sdm/issues/437)
-   Add "build aware" code transform support. Replaces "dry run" support presently in `sdm-core`.
-   `CodeTransform` now takes a second argument of type `CommandListenerInvocation` for consistency and to expose more context to transforms.
-   `CodeInspecton` registration to run a non-mutating command against one or more repositories.
-   Add goal set completion listener. [#275](https://github.com/atomist/sdm/issues/275)
-   Support BitBucket. [#225](https://github.com/atomist/sdm/issues/225)
-   `CodeTransform` registration can now specify a `react` method to run after transforms are complete.
-   Add ability to extract and report goal Progress. [#455](https://github.com/atomist/sdm/issues/455)
-   Add predicate mapping cost analyzer. [#459](https://github.com/atomist/sdm/issues/459)
-   Collect names of Goal and Goals instances in contributor model. [#461](https://github.com/atomist/sdm/issues/461)
-   Add `GoalExecutionListener` to track goal execution within an SDM.
-   Add support voting on goal approval in an SDM. [#465](https://github.com/atomist/sdm/issues/465)
-   Add goal locking model through `LockingGoal` and `Goals.andLock()`

### Changed

-   **BREAKING** Command handler and autofix registrations are now strongly typed, defaulting to `NoParameters` rather than `any`.
-   **BREAKING** Remove deprecated `addEditor` SDM method, and deprecated `createTransform` method on `ProjectOperationRegistration`.
-   **BREAKING** `addPushReaction` renamed `addPushImpactListener` for consistency.
-   **BREAKING** `addNewRepoWithCodeAction` renamed `addNewRepoWithCodeListener` for consistency.
-   **BREAKING**  `CodeTransformRegistration.editMode` is replaced by `transformPresentation`.
-   **BREAKING** `CommandHandler` registrations must now specify a `listener`. `createCommand` alternative is removed.
-   **BREAKING** Review listeners must now have names. Introduced `ReviewListenerRegistration`

### Fixed

-   Make a better workaround for not getting org token on custom events. [#279](https://github.com/atomist/sdm/issues/279)
-   Link is missing on npm publish goal. [#447](https://github.com/atomist/sdm/issues/447)

## [0.3.1](https://github.com/atomist/sdm/compare/0.3.0...0.3.1) - 2018-07-05

### Added

-   Timeout goals after 10mins or config value. [#427](https://github.com/atomist/sdm/issues/427)
-   Allow generator registrations to specify a starting point. [#425](https://github.com/atomist/sdm/issues/425)

### Changed

-   Rename "editor" to "codeTransform" for clarity. [#424](https://github.com/atomist/sdm/issues/424)
-   **BREAKING** `onAnyPush` becomes a function to avoid side effects.
-   **BREAKING** `CodeTransform` is now an alias for `SimpleProjectEditor` to make the commonest case natural. Use `CodeTransformRegisterable` to return an `EditResult`.
-   Generators can now have parameter types that don't extend `SeedDrivenGeneratorParameters`, as this will be mixed in.

### Deprecated

-   Rename to GoalInvocation; deprecate status. [#426](https://github.com/atomist/sdm/issues/426)

### Removed

-   Do not memoize pre-emptively. [#431](https://github.com/atomist/sdm/issues/431)

## [0.3.0](https://github.com/atomist/sdm/tree/0.3.0) - 2018-06-16

### Changed

-   **BREAKING** Broke out `sdm` and `sdm-core`.
