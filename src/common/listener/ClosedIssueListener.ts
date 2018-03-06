import * as schema from "../../typings/types";

import { ListenerInvocation, SdmListener } from "./Listener";

export type Issue = schema.OnClosedIssue.Issue;

export interface ClosedIssueInvocation extends ListenerInvocation {

    issue: Issue;
}

export type ClosedIssueListener = SdmListener<ClosedIssueInvocation>;
