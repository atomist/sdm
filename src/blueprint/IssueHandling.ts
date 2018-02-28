import { NewIssueListener } from "../common/listener/NewIssueListener";
import { FunctionalUnit } from "./FunctionalUnit";

export interface IssueHandling extends FunctionalUnit {

    newIssueListeners: NewIssueListener[];
}
