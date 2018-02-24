import { FunctionalUnit } from "./FunctionalUnit";
import { NewIssueListener } from "../handlers/events/issue/NewIssueHandler";

export interface IssueHandling extends FunctionalUnit {

    newIssueListeners: NewIssueListener[];
}
