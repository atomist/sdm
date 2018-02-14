import {GitHubDotComBase, GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import axios, {AxiosPromise, AxiosRequestConfig} from "axios";
import {logger} from "@atomist/automation-client";
import * as _ from "lodash";

export type State = "error" | "failure" | "pending" | "success";

export interface Status {
    state: State;
    target_url: string;
    description?: string;
    context?: string;
}

export function createStatus(token: string, rr: GitHubRepoRef, status: Status): AxiosPromise {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/statuses/${rr.sha}`;
    console.log(`Updating github status: ${url} to ${JSON.stringify(status)}`);
    return axios.post(url, status, config)
        .catch(err =>
            Promise.reject(new Error(`Error hitting ${url} to set status ${JSON.stringify(status)}: ${err.message}`)),
        );
}

export interface Gist {
    description: string;
    files: Array<{ path: string, content: string }>;
    public: boolean;
}

export function createGist(xtoken: string, gist: Gist, apiBase: string = GitHubDotComBase): Promise<string> {
    // TODO need the scope correct here
    const token = process.env.GITHUB_TOKEN;
    const config = authHeaders(token);
    const url = `${apiBase}/gists`;
    const data: any = {
        description: gist.description,
        public: gist.public,
        files: {},
    };
    gist.files.forEach(f => data.files[f.path] = {content: f.content});
    return axios.post(url, data, config)
        .then(res => {
            return res.data.html_url;
        }, gistError => {
            logger.error("Failure creating gist at " + url + "\n" + gistError.message);
            logger.error(_.get(gistError, "response.data", "no data"));
            throw new Error("Failure creating gist at " + url + "\n" + gistError.message);
        });
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
