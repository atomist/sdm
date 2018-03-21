/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
        owner?: string | null;
        ownerType?: OwnerType | null;
        provider?: Provider | null;
    }

    export interface Provider {
        providerId?: string | null;
        apiUrl?: string | null;
        url?: string | null;
    }

    export interface ChatTeam {
        id?: string | null;
    }

    export interface Pushes {
        before?: Commit;
        branch?: string | null;
        commits?: Commit[] | null;
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

    export enum OwnerType {
        user = "user",
        organization = "organization",
    }
}
