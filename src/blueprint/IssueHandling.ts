import { ClosedIssueListener } from "../common/listener/ClosedIssueListener";
import { NewIssueListener } from "../common/listener/NewIssueListener";
import { UpdatedIssueListener } from "../common/listener/UpdatedIssueListener";
import { FunctionalUnit } from "./FunctionalUnit";

export interface IssueHandling extends FunctionalUnit {

    newIssueListeners: NewIssueListener[];

    updatedIssueListeners: UpdatedIssueListener[];

    closedIssueListeners: ClosedIssueListener[];

}
