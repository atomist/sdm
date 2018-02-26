import { FunctionalUnit } from "./FunctionalUnit";
import { SdmListener } from "../handlers/events/delivery/Listener";
import { NewIssueInvocation } from "../handlers/events/issue/NewIssueHandler";

export interface IssueHandling extends FunctionalUnit {

    newIssueListeners: Array<SdmListener<NewIssueInvocation>>;
}
