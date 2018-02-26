import { SdmListener } from "../handlers/events/delivery/Listener";
import { NewIssueInvocation } from "../handlers/events/issue/NewIssueHandler";
import { FunctionalUnit } from "./FunctionalUnit";

export interface IssueHandling extends FunctionalUnit {

    newIssueListeners: Array<SdmListener<NewIssueInvocation>>;
}
