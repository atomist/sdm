import { NewRepoWithCodeAction } from "../../../handlers/events/repo/OnFirstPushToRepo";
import { publishTags } from "../../../handlers/events/repo/publishTags";
import { Tagger } from "@atomist/automation-client/operations/tagger/Tagger";

/**
 * Tag the repo using the given tagger
 * @param {Tagger} tagger
 * @return {NewRepoWithCodeAction}
 */
export function tagRepo(tagger: Tagger): NewRepoWithCodeAction {
    // TODO why doesn't curry work
    // curry(springBootTagger)(publishTags);
    return (id,
            creds,
            addressChannels,
            ctx) => publishTags(tagger, id, creds, addressChannels, ctx);
}
