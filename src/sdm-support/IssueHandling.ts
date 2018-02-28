import { NewIssueListener } from "../handlers/events/issue/NewIssueListener";
import { FunctionalUnit } from "./FunctionalUnit";

export interface IssueHandling extends FunctionalUnit {

    newIssueListeners: NewIssueListener[];
}
