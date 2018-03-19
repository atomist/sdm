
import { HandlerContext, HandlerResult } from "@atomist/automation-client";
import { StatusState } from "../../../typings/types";
import { HasChannels } from "../../slack/addressChannels";
import { Goal } from "./Goal";

export interface ExecuteGoalInvocation {
    implementationName: string;
    githubToken: string;
    goal: Goal;
}

export interface ExecuteGoalResult extends HandlerResult {
    targetUrl?: string;
    requireApproval?: boolean;
}

export type GoalExecutor = (status: StatusForExecuteGoal.Status,
                            ctx: HandlerContext,
                            params: ExecuteGoalInvocation) => Promise<ExecuteGoalResult>;

// tslint:disable-next-line:no-namespace
export namespace StatusForExecuteGoal {

    export interface Org {
        chatTeam?: ChatTeam | null;
    }

    export interface ChatTeam {
        id?: string | null;
    }

    export interface Pushes {
        before?: Commit;
        branch?: string | null;
        id?: string | null;
    }

    export interface Image {
        image?: string | null;
        imageName?: string | null;
    }
    export interface Repo extends HasChannels {
        owner?: string | null;
        name?: string | null;
        defaultBranch?: string | null;
        org?: Org | null;
    }

    export interface Statuses {
        context?: string | null;
        description?: string | null;
        state?: StatusState | null;
        targetUrl?: string | null;
    }

    export interface Commit {
        sha?: string | null;
        message?: string | null;
        statuses?: Statuses[] | null;
        repo?: Repo | null;
        pushes?: Pushes[] | null;
        image?: Image | null;
    }

    export interface Status {
        commit?: Commit | null;
        state?: StatusState | null;
        targetUrl?: string | null;
        context?: string | null;
        description?: string | null;
    }
}
