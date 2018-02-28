import { Tagger } from "@atomist/automation-client/operations/tagger/Tagger";
import { ProjectListener } from "../../../common/listener/Listener";
import { publishTags } from "../../../handlers/events/repo/publishTags";

/**
 * Tag the repo using the given tagger
 * @param {Tagger} tagger
 */
export function tagRepo(tagger: Tagger): ProjectListener {
    return i => publishTags(tagger, i.id, i.credentials, i.addressChannels, i.context);
}
