/**
 * Added to end of URL of a status to fire manual approval step
 * @type {string}
 */
import { GitHubStatus } from "../../../../common/goals/gitHubContext";

export const ApprovalGateParam = "atomist:approve=true";

/**
 * Return a form of this URL for approval
 * @param {string} url
 * @return {string}
 */
export function forApproval(url: string): string {
    return url +
        (url.includes("?") ? "&" : "?") +
        ApprovalGateParam;
}

export function requiresApproval(ghs: GitHubStatus) {
    return ghs.targetUrl && ghs.targetUrl.endsWith(ApprovalGateParam);
}
