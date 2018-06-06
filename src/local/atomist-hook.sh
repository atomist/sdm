#!/bin/sh

hookDir=$2
event=$1

echo "git hook fire: Invoking Atomist $event against $hookDir"

# TODO make this Atomist base
node \
/Users/rodjohnson/sforzando-dev/idea-projects/my-flow/build/src/local/invocation/git/onGitHook.js \
    $event \
    $hookDir \
    $(git rev-parse --abbrev-ref HEAD) \
    $(git rev-parse HEAD) \
&
