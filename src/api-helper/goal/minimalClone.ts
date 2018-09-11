import { CloneOptions } from "@atomist/automation-client/spi/clone/DirectoryManager";
import { PushFields } from "../../typings/types";

export function minimalClone(push: PushFields.Fragment, extras: Partial<CloneOptions> = {}): CloneOptions {
    // we need at least the commits of the push + 1 to be able to diff it
    return { depth: push.commits.length + 1, ...extras };
}
