# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/sdm/compare/0.3.1...HEAD)

## [0.3.1](https://github.com/atomist/sdm/compare/0.3.0...0.3.1) - 2018-07-05

### Changed

-   Rename "editor" to "codeTransform" for clarity. [#424](https://github.com/atomist/sdm/issues/424)
-   **BREAKING** `onAnyPush` becomes a function to avoid side effects.
-   **BREAKING** `CodeTransform` is now an alias for `SimpleProjectEditor` to make the commonest case natural. Use `CodeTransformRegisterable` to return an `EditResult`.

### Added

-   Timeout goals after 10mins or config value. [#427](https://github.com/atomist/sdm/issues/427)
-   Allow generator registrations to specify a starting point. [#425](https://github.com/atomist/sdm/issues/425)

### Deprecated

-   Rename to GoalInvocation; deprecate status. [#426](https://github.com/atomist/sdm/issues/426)

### Removed

-   Do not memoize pre-emptively. [#431](https://github.com/atomist/sdm/issues/431)

## [0.3.0](https://github.com/atomist/sdm/tree/HEAD) - 2018-06-16

### Changed

-   **BREAKING** Broke out `sdm` and `sdm-core`.
