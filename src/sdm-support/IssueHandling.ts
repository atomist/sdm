import { NewIssueListener } from "../handlers/events/issue/NewIssueHandler";
import { FunctionalUnit } from "./FunctionalUnit";

export interface IssueHandling extends FunctionalUnit {

    newIssueListeners: NewIssueListener[];
}
