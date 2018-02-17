import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { NewRepoWithCodeAction } from "../../../handlers/events/repo/OnFirstPushToRepo";
import { publishTags } from "../../../handlers/events/repo/publishTags";

// TODO why doesn't curry work
export const tagRepo: NewRepoWithCodeAction = // curry(springBootTagger)(publishTags);
    (id,
     creds,
     addressChannels,
     ctx) => publishTags(springBootTagger, id, creds, addressChannels, ctx);
