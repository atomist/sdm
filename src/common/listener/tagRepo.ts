import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Tagger } from "@atomist/automation-client/operations/tagger/Tagger";
import { publishTags } from "../../handlers/events/repo/publishTags";
import { ProjectListener } from "./Listener";

/**
 * Tag the repo using the given tagger
 * @param {Tagger} tagger
 */
export function tagRepo(tagger: Tagger): ProjectListener {
    return async pInv =>
        isGitHubRepoRef(pInv.id) ?
            publishTags(tagger, pInv.id, pInv.credentials, pInv.addressChannels, pInv.context) :
            true;
}
