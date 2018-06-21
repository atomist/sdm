# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased][]

[Unreleased]: https://github.com/atomist/sdm/compare/0.2.4...HEAD

### BREAKING

- EditorRegistration supports general editorCommand customizations, instead of specifically dryRun.
If you were setting `dryRun = true`, set `editorCommandFactory = dryRunEditorCommand` instead.

## [0.2.3][https://github.com/atomist/sdm/compare/0.2.2...0.2.3] - 2018-06-18

### BREAKING

-   SeedDrivenGeneratorSupport allows you to override the seed. This fixes a bug with overriding the seed name,
and also adds the ability to override the owner. Only GitHub repositories are supported.
This changes the type of GeneratorConfig.seed; give it a function that returns a _new_ seed repoRef, instead of a constant one. 

## Earlier

### Added

-   Can provide tag when publishing NPM package [#404][404]

[404]: https://github.com/atomist/sdm/issues/404

## [0.1.0][] - 2018-05-16

Initial release

[0.1.0]: https://github.com/atomist/sdm/tree/0.1.0

### Added

-   Everything
