import { GoalInvocation } from "../GoalInvocation";

export interface Progress {

    message?: string;

}

export interface ReportProgress {

    report(log: string, gi: GoalInvocation): Promise<Progress>;

}