/*
 * Copyright © 2020 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as semver from "semver";
import { formatDate } from "../../api-helper/misc/dateFormat";
import { GoalInvocation } from "../../api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";

/**
 * Make a release version a branch-aware pre-release version.  A
 * timestamp is appended to the version.  If the goal event was
 * triggered from a non-default branch, a sanitized version of the
 * branch name is inserted between the release version and the
 * timestamp.
 *
 * @param baseVersion Release-style semantic version, i.e., M.N.P
 * @param goalEvent SDM goal event triggering this action
 * @return Clean, branch-aware, pre-release version string
 */
export function addBranchPreRelease(baseVersion: string, goalEvent: SdmGoalEvent): string {
    const branch = goalEvent.branch;
    const branchSuffix =
        goalEvent.push.repo && branch === goalEvent.push.repo.defaultBranch
            ? ""
            : cleanSemVerPrereleaseIdentifier(`branch-${branch}`) + ".";
    const ts = formatDate();
    const prereleaseVersion = `${baseVersion}-${branchSuffix}${ts}`;
    return prereleaseVersion;
}

/**
 * Take a possibly invalid semantic version and make it valid.  The
 * function replaces `_`, `.`, and `/` with `-`, removes characters
 * not allowed in a prerelease identifier, and remove adjacent `-`
 * characters.  If the resulting cleaned identifier starts with a zero
 * (0) and is all numbers, leading zeroes are removed.  If removing
 * leading zeroes leads to an empty identifier, "ZERO" is returned.
 *
 * @param v Possibly invalid semantic version prerelease identifier
 * @return Clean semantic version prerelease identifier string
 */
export function cleanSemVerPrereleaseIdentifier(i: string): string {
    const clean = i
        .replace(/[_./]+/g, "-")
        .replace(/[^-a-zA-Z0-9]+/g, "")
        .replace(/-+/g, "-");
    if (/^0[0-9]*$/.test(clean)) {
        const trimmed = clean.replace(/^0+/, "");
        if (trimmed.length < 1) {
            return "ZERO";
        } else {
            return trimmed;
        }
    }
    return clean;
}

/**
 * Calculate release version from provided prerelease version, also
 * stripping any build metadata if present.
 *
 * @param prVersion Semantic version to reduce to release version
 * @return Release semantic version
 */
export function releaseVersion(prVersion: string): string {
    return prVersion.replace(/[-+].*/, "");
}

/**
 * Iterate through all the tags associated with the after commit
 * of the push for the provided goal invocation.  If any tag is a
 * milesone or release candidate version, return that version.
 * Otherwise, return `undefined`.
 *
 * @param gi Goal invocation
 * @return Milestone or release candidate version or `undefined`
 */
export function goalMilestoneOrRcVersion(gi: GoalInvocation): string | undefined {
    const tags = gi.goalEvent.push.after && gi.goalEvent.push.after.tags ? gi.goalEvent.push.after.tags : [];
    const tag = tags.find(t => t && t.name && isMilestoneOrReleaseCandidate(t.name));
    if (tag && tag.name) {
        return tag.name;
    } else {
        return undefined;
    }
}

/**
 * If there is a milestone or release candidate version tag associated
 * with the after commit for the push triggering the provided goal
 * invocation, return it.  Otherwise return the provided version
 * stripped of any prerelease identifier and/or build metadata.
 *
 * This helps you treat more standard prerelease versions, i.e.,
 * milestone and release candidate versions, like real releases.
 *
 * @param version Prerelease version string
 * @param gi Goal invocation
 * @return Release, milestone, or release candidate version
 */
export function releaseLikeVersion(version: string, gi: GoalInvocation): string {
    const prVersion = goalMilestoneOrRcVersion(gi);
    if (prVersion) {
        return prVersion;
    } else {
        return releaseVersion(version);
    }
}

/**
 * Determine if provided version is a milestone or release candidate
 * version, i.e., a prerelease whose first prerelease identifer is "M"
 * or "RC".
 *
 * @param version Version to interrogate
 * @return `true` if version is a milestone or release candidate, `false` otherwise
 */
export function isMilestoneOrReleaseCandidate(version: string): boolean {
    const preRelease = semver.prerelease(version);
    return !!preRelease && ["M", "RC"].includes(preRelease[0]);
}
