import { Tagger } from "@atomist/automation-client/operations/tagger/Tagger";
import { publishTags } from "../../handlers/events/repo/publishTags";
import { ProjectListener } from "./Listener";

/**
 * Tag the repo using the given tagger
 * @param {Tagger} tagger
 */
export function tagRepo(tagger: Tagger): ProjectListener {
    return i => publishTags(tagger, i.id, i.credentials, i.addressChannels, i.context);
}
