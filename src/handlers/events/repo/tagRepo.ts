import { Tagger } from "@atomist/automation-client/operations/tagger/Tagger";
import { publishTags } from "../../../handlers/events/repo/publishTags";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { SdmListener } from "../delivery/Listener";

/**
 * Tag the repo using the given tagger
 * @param {Tagger} tagger
 */
export function tagRepo(tagger: Tagger): SdmListener<GitHubRepoRef> {

    // TODO why doesn't curry work
    // curry(springBootTagger)(publishTags);
    return i => publishTags(tagger, i.id, i.credentials, i.addressChannels, i.context);
}
