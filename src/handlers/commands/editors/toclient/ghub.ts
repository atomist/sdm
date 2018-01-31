import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

export type State = "error" |  "failure" | "pending" | "success";

export interface Status {
    state: State;
    target_url: string;
    description?: string;
    context?: string;
}

export function createStatus(token: string, rr: GitHubRepoRef, status: Status): AxiosPromise {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/statuses/${rr.sha}`;
    return axios.post(url, status, config);
}

export function listStatuses(token: string, rr: GitHubRepoRef): Promise<Status[]> {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/commits/${rr.sha}/statuses`;
    return axios.get(url, config)
        .then(ap => ap.data);
}

function authHeaders(token: string): AxiosRequestConfig {
    return token ? {
            headers: {
                Authorization: `token ${token}`,
            },
        }
        : {};
}
