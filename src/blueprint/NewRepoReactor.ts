
import { HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import { OnRepoCreation } from "../typings/types";

export interface NewRepoReactor {

    onRepoCreation?: Maker<HandleEvent<OnRepoCreation.Subscription>>;

    onNewRepoWithCode: Maker<OnFirstPushToRepo>;
}
