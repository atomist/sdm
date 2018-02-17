import { OnFirstPushToRepo } from "../../../handlers/events/repo/OnFirstPushToRepo";
import { suggestAddingCloudFoundryManifest } from "./suggestAddingCloudFoundryManifest";
import { tagRepo } from "./tagRepo";

export const OnNewRepoWithCode = () => new OnFirstPushToRepo([tagRepo, suggestAddingCloudFoundryManifest]);
