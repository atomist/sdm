import * as schema from "../../typings/types";

import { ListenerInvocation, SdmListener } from "./Listener";

export type Issue = schema.OnNewIssue.Issue;

export interface NewIssueInvocation extends ListenerInvocation {

    issue: Issue;
}

export type NewIssueListener = SdmListener<NewIssueInvocation>;
