import * as schema from "../../typings/types";

import { ListenerInvocation, SdmListener } from "./Listener";

export type Issue = schema.OnIssueAction.Issue;

export interface UpdatedIssueInvocation extends ListenerInvocation {

    issue: Issue;
}

export type UpdatedIssueListener = SdmListener<UpdatedIssueInvocation>;
