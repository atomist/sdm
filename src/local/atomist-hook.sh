#!/bin/sh

script=$1
hookDir=$3
event=$2

# echo "git hook fire: Invoking Atomist $event against $hookDir"

node $script\
    $event \
    $hookDir \
    $(git rev-parse --abbrev-ref HEAD) \
    $(git rev-parse HEAD) \
# &
