/*
 * Copyright © 2018 Atomist, Inc.
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

/* tslint:disable */

/* Long type */
export type Long = any;
/* Filter Input Type for Issue */
export interface _IssueFilter {
  AND?: _IssueFilter[] | null /* AND */;
  OR?: _IssueFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  number?: number | null /* number */;
  number_not?: number | null /* number_not */;
  number_in?: number[] | null /* number_in */;
  number_not_in?: number[] | null /* number_not_in */;
  number_lt?: number | null /* number_lt */;
  number_lte?: number | null /* number_lte */;
  number_gt?: number | null /* number_gt */;
  number_gte?: number | null /* number_gte */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  title?: string | null /* title */;
  title_not?: string | null /* title_not */;
  title_in?: string[] | null /* title_in */;
  title_not_in?: string[] | null /* title_not_in */;
  title_lt?: string | null /* title_lt */;
  title_lte?: string | null /* title_lte */;
  title_gt?: string | null /* title_gt */;
  title_gte?: string | null /* title_gte */;
  title_contains?: string | null /* title_contains */;
  title_not_contains?: string | null /* title_not_contains */;
  title_starts_with?: string | null /* title_starts_with */;
  title_not_starts_with?: string | null /* title_not_starts_with */;
  title_ends_with?: string | null /* title_ends_with */;
  title_not_ends_with?: string | null /* title_not_ends_with */;
  body?: string | null /* body */;
  body_not?: string | null /* body_not */;
  body_in?: string[] | null /* body_in */;
  body_not_in?: string[] | null /* body_not_in */;
  body_lt?: string | null /* body_lt */;
  body_lte?: string | null /* body_lte */;
  body_gt?: string | null /* body_gt */;
  body_gte?: string | null /* body_gte */;
  body_contains?: string | null /* body_contains */;
  body_not_contains?: string | null /* body_not_contains */;
  body_starts_with?: string | null /* body_starts_with */;
  body_not_starts_with?: string | null /* body_not_starts_with */;
  body_ends_with?: string | null /* body_ends_with */;
  body_not_ends_with?: string | null /* body_not_ends_with */;
  state?: IssueState | null /* state */;
  state_not?: IssueState | null /* state_not */;
  state_in?: IssueState[] | null /* state_in */;
  state_not_in?: IssueState[] | null /* state_not_in */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  action?: string | null /* action */;
  action_not?: string | null /* action_not */;
  action_in?: string[] | null /* action_in */;
  action_not_in?: string[] | null /* action_not_in */;
  action_lt?: string | null /* action_lt */;
  action_lte?: string | null /* action_lte */;
  action_gt?: string | null /* action_gt */;
  action_gte?: string | null /* action_gte */;
  action_contains?: string | null /* action_contains */;
  action_not_contains?: string | null /* action_not_contains */;
  action_starts_with?: string | null /* action_starts_with */;
  action_not_starts_with?: string | null /* action_not_starts_with */;
  action_ends_with?: string | null /* action_ends_with */;
  action_not_ends_with?: string | null /* action_not_ends_with */;
  createdAt?: string | null /* createdAt */;
  createdAt_not?: string | null /* createdAt_not */;
  createdAt_in?: string[] | null /* createdAt_in */;
  createdAt_not_in?: string[] | null /* createdAt_not_in */;
  createdAt_lt?: string | null /* createdAt_lt */;
  createdAt_lte?: string | null /* createdAt_lte */;
  createdAt_gt?: string | null /* createdAt_gt */;
  createdAt_gte?: string | null /* createdAt_gte */;
  createdAt_contains?: string | null /* createdAt_contains */;
  createdAt_not_contains?: string | null /* createdAt_not_contains */;
  createdAt_starts_with?: string | null /* createdAt_starts_with */;
  createdAt_not_starts_with?: string | null /* createdAt_not_starts_with */;
  createdAt_ends_with?: string | null /* createdAt_ends_with */;
  createdAt_not_ends_with?: string | null /* createdAt_not_ends_with */;
  updatedAt?: string | null /* updatedAt */;
  updatedAt_not?: string | null /* updatedAt_not */;
  updatedAt_in?: string[] | null /* updatedAt_in */;
  updatedAt_not_in?: string[] | null /* updatedAt_not_in */;
  updatedAt_lt?: string | null /* updatedAt_lt */;
  updatedAt_lte?: string | null /* updatedAt_lte */;
  updatedAt_gt?: string | null /* updatedAt_gt */;
  updatedAt_gte?: string | null /* updatedAt_gte */;
  updatedAt_contains?: string | null /* updatedAt_contains */;
  updatedAt_not_contains?: string | null /* updatedAt_not_contains */;
  updatedAt_starts_with?: string | null /* updatedAt_starts_with */;
  updatedAt_not_starts_with?: string | null /* updatedAt_not_starts_with */;
  updatedAt_ends_with?: string | null /* updatedAt_ends_with */;
  updatedAt_not_ends_with?: string | null /* updatedAt_not_ends_with */;
  closedAt?: string | null /* closedAt */;
  closedAt_not?: string | null /* closedAt_not */;
  closedAt_in?: string[] | null /* closedAt_in */;
  closedAt_not_in?: string[] | null /* closedAt_not_in */;
  closedAt_lt?: string | null /* closedAt_lt */;
  closedAt_lte?: string | null /* closedAt_lte */;
  closedAt_gt?: string | null /* closedAt_gt */;
  closedAt_gte?: string | null /* closedAt_gte */;
  closedAt_contains?: string | null /* closedAt_contains */;
  closedAt_not_contains?: string | null /* closedAt_not_contains */;
  closedAt_starts_with?: string | null /* closedAt_starts_with */;
  closedAt_not_starts_with?: string | null /* closedAt_not_starts_with */;
  closedAt_ends_with?: string | null /* closedAt_ends_with */;
  closedAt_not_ends_with?: string | null /* closedAt_not_ends_with */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
  resolvingCommits?: _CommitFilter | null /* resolvingCommits */;
  resolvingCommits_not?: _CommitFilter | null /* resolvingCommits_not */;
  resolvingCommits_in?: _CommitFilter | null /* resolvingCommits_in */;
  resolvingCommits_not_in?: _CommitFilter | null /* resolvingCommits_not_in */;
  resolvingCommits_some?: _CommitFilter | null /* resolvingCommits_some */;
  resolvingCommits_none?: _CommitFilter | null /* resolvingCommits_none */;
  resolvingCommits_single?: _CommitFilter | null /* resolvingCommits_single */;
  resolvingCommits_every?: _CommitFilter | null /* resolvingCommits_every */;
  openedBy?: _SCMIdFilter | null /* openedBy */;
  openedBy_not?: _SCMIdFilter | null /* openedBy_not */;
  openedBy_in?: _SCMIdFilter | null /* openedBy_in */;
  openedBy_not_in?: _SCMIdFilter | null /* openedBy_not_in */;
  closedBy?: _SCMIdFilter | null /* closedBy */;
  closedBy_not?: _SCMIdFilter | null /* closedBy_not */;
  closedBy_in?: _SCMIdFilter | null /* closedBy_in */;
  closedBy_not_in?: _SCMIdFilter | null /* closedBy_not_in */;
  labels?: _LabelFilter | null /* labels */;
  labels_not?: _LabelFilter | null /* labels_not */;
  labels_in?: _LabelFilter | null /* labels_in */;
  labels_not_in?: _LabelFilter | null /* labels_not_in */;
  labels_some?: _LabelFilter | null /* labels_some */;
  labels_none?: _LabelFilter | null /* labels_none */;
  labels_single?: _LabelFilter | null /* labels_single */;
  labels_every?: _LabelFilter | null /* labels_every */;
  assignees?: _SCMIdFilter | null /* assignees */;
  assignees_not?: _SCMIdFilter | null /* assignees_not */;
  assignees_in?: _SCMIdFilter | null /* assignees_in */;
  assignees_not_in?: _SCMIdFilter | null /* assignees_not_in */;
  assignees_some?: _SCMIdFilter | null /* assignees_some */;
  assignees_none?: _SCMIdFilter | null /* assignees_none */;
  assignees_single?: _SCMIdFilter | null /* assignees_single */;
  assignees_every?: _SCMIdFilter | null /* assignees_every */;
  lastAssignedBy?: _SCMIdFilter | null /* lastAssignedBy */;
  lastAssignedBy_not?: _SCMIdFilter | null /* lastAssignedBy_not */;
  lastAssignedBy_in?: _SCMIdFilter | null /* lastAssignedBy_in */;
  lastAssignedBy_not_in?: _SCMIdFilter | null /* lastAssignedBy_not_in */;
  comments?: _CommentFilter | null /* comments */;
  comments_not?: _CommentFilter | null /* comments_not */;
  comments_in?: _CommentFilter | null /* comments_in */;
  comments_not_in?: _CommentFilter | null /* comments_not_in */;
  comments_some?: _CommentFilter | null /* comments_some */;
  comments_none?: _CommentFilter | null /* comments_none */;
  comments_single?: _CommentFilter | null /* comments_single */;
  comments_every?: _CommentFilter | null /* comments_every */;
}
/* Filter Input Type for Repo */
export interface _RepoFilter {
  AND?: _RepoFilter[] | null /* AND */;
  OR?: _RepoFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  owner?: string | null /* owner */;
  owner_not?: string | null /* owner_not */;
  owner_in?: string[] | null /* owner_in */;
  owner_not_in?: string[] | null /* owner_not_in */;
  owner_lt?: string | null /* owner_lt */;
  owner_lte?: string | null /* owner_lte */;
  owner_gt?: string | null /* owner_gt */;
  owner_gte?: string | null /* owner_gte */;
  owner_contains?: string | null /* owner_contains */;
  owner_not_contains?: string | null /* owner_not_contains */;
  owner_starts_with?: string | null /* owner_starts_with */;
  owner_not_starts_with?: string | null /* owner_not_starts_with */;
  owner_ends_with?: string | null /* owner_ends_with */;
  owner_not_ends_with?: string | null /* owner_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  allowRebaseMerge?: boolean | null /* allowRebaseMerge */;
  allowRebaseMerge_not?: boolean | null /* allowRebaseMerge_not */;
  allowSquashMerge?: boolean | null /* allowSquashMerge */;
  allowSquashMerge_not?: boolean | null /* allowSquashMerge_not */;
  allowMergeCommit?: boolean | null /* allowMergeCommit */;
  allowMergeCommit_not?: boolean | null /* allowMergeCommit_not */;
  repoId?: string | null /* repoId */;
  repoId_not?: string | null /* repoId_not */;
  repoId_in?: string[] | null /* repoId_in */;
  repoId_not_in?: string[] | null /* repoId_not_in */;
  repoId_lt?: string | null /* repoId_lt */;
  repoId_lte?: string | null /* repoId_lte */;
  repoId_gt?: string | null /* repoId_gt */;
  repoId_gte?: string | null /* repoId_gte */;
  repoId_contains?: string | null /* repoId_contains */;
  repoId_not_contains?: string | null /* repoId_not_contains */;
  repoId_starts_with?: string | null /* repoId_starts_with */;
  repoId_not_starts_with?: string | null /* repoId_not_starts_with */;
  repoId_ends_with?: string | null /* repoId_ends_with */;
  repoId_not_ends_with?: string | null /* repoId_not_ends_with */;
  gitHubId?: string | null /* gitHubId */;
  gitHubId_not?: string | null /* gitHubId_not */;
  gitHubId_in?: string[] | null /* gitHubId_in */;
  gitHubId_not_in?: string[] | null /* gitHubId_not_in */;
  gitHubId_lt?: string | null /* gitHubId_lt */;
  gitHubId_lte?: string | null /* gitHubId_lte */;
  gitHubId_gt?: string | null /* gitHubId_gt */;
  gitHubId_gte?: string | null /* gitHubId_gte */;
  gitHubId_contains?: string | null /* gitHubId_contains */;
  gitHubId_not_contains?: string | null /* gitHubId_not_contains */;
  gitHubId_starts_with?: string | null /* gitHubId_starts_with */;
  gitHubId_not_starts_with?: string | null /* gitHubId_not_starts_with */;
  gitHubId_ends_with?: string | null /* gitHubId_ends_with */;
  gitHubId_not_ends_with?: string | null /* gitHubId_not_ends_with */;
  defaultBranch?: string | null /* defaultBranch */;
  defaultBranch_not?: string | null /* defaultBranch_not */;
  defaultBranch_in?: string[] | null /* defaultBranch_in */;
  defaultBranch_not_in?: string[] | null /* defaultBranch_not_in */;
  defaultBranch_lt?: string | null /* defaultBranch_lt */;
  defaultBranch_lte?: string | null /* defaultBranch_lte */;
  defaultBranch_gt?: string | null /* defaultBranch_gt */;
  defaultBranch_gte?: string | null /* defaultBranch_gte */;
  defaultBranch_contains?: string | null /* defaultBranch_contains */;
  defaultBranch_not_contains?: string | null /* defaultBranch_not_contains */;
  defaultBranch_starts_with?: string | null /* defaultBranch_starts_with */;
  defaultBranch_not_starts_with?:
    | string
    | null /* defaultBranch_not_starts_with */;
  defaultBranch_ends_with?: string | null /* defaultBranch_ends_with */;
  defaultBranch_not_ends_with?: string | null /* defaultBranch_not_ends_with */;
  labels?: _LabelFilter | null /* labels */;
  labels_not?: _LabelFilter | null /* labels_not */;
  labels_in?: _LabelFilter | null /* labels_in */;
  labels_not_in?: _LabelFilter | null /* labels_not_in */;
  labels_some?: _LabelFilter | null /* labels_some */;
  labels_none?: _LabelFilter | null /* labels_none */;
  labels_single?: _LabelFilter | null /* labels_single */;
  labels_every?: _LabelFilter | null /* labels_every */;
  channels?: _ChatChannelFilter | null /* channels */;
  channels_not?: _ChatChannelFilter | null /* channels_not */;
  channels_in?: _ChatChannelFilter | null /* channels_in */;
  channels_not_in?: _ChatChannelFilter | null /* channels_not_in */;
  channels_some?: _ChatChannelFilter | null /* channels_some */;
  channels_none?: _ChatChannelFilter | null /* channels_none */;
  channels_single?: _ChatChannelFilter | null /* channels_single */;
  channels_every?: _ChatChannelFilter | null /* channels_every */;
  org?: _OrgFilter | null /* org */;
  org_not?: _OrgFilter | null /* org_not */;
  org_in?: _OrgFilter | null /* org_in */;
  org_not_in?: _OrgFilter | null /* org_not_in */;
  issue?: _IssueFilter | null /* issue */;
  issue_not?: _IssueFilter | null /* issue_not */;
  issue_in?: _IssueFilter | null /* issue_in */;
  issue_not_in?: _IssueFilter | null /* issue_not_in */;
  issue_some?: _IssueFilter | null /* issue_some */;
  issue_none?: _IssueFilter | null /* issue_none */;
  issue_single?: _IssueFilter | null /* issue_single */;
  issue_every?: _IssueFilter | null /* issue_every */;
  issues?: _IssueFilter | null /* issues */;
  issues_not?: _IssueFilter | null /* issues_not */;
  issues_in?: _IssueFilter | null /* issues_in */;
  issues_not_in?: _IssueFilter | null /* issues_not_in */;
  issues_some?: _IssueFilter | null /* issues_some */;
  issues_none?: _IssueFilter | null /* issues_none */;
  issues_single?: _IssueFilter | null /* issues_single */;
  issues_every?: _IssueFilter | null /* issues_every */;
  pullRequest?: _PullRequestFilter | null /* pullRequest */;
  pullRequest_not?: _PullRequestFilter | null /* pullRequest_not */;
  pullRequest_in?: _PullRequestFilter | null /* pullRequest_in */;
  pullRequest_not_in?: _PullRequestFilter | null /* pullRequest_not_in */;
  pullRequest_some?: _PullRequestFilter | null /* pullRequest_some */;
  pullRequest_none?: _PullRequestFilter | null /* pullRequest_none */;
  pullRequest_single?: _PullRequestFilter | null /* pullRequest_single */;
  pullRequest_every?: _PullRequestFilter | null /* pullRequest_every */;
  pullRequests?: _PullRequestFilter | null /* pullRequests */;
  pullRequests_not?: _PullRequestFilter | null /* pullRequests_not */;
  pullRequests_in?: _PullRequestFilter | null /* pullRequests_in */;
  pullRequests_not_in?: _PullRequestFilter | null /* pullRequests_not_in */;
  pullRequests_some?: _PullRequestFilter | null /* pullRequests_some */;
  pullRequests_none?: _PullRequestFilter | null /* pullRequests_none */;
  pullRequests_single?: _PullRequestFilter | null /* pullRequests_single */;
  pullRequests_every?: _PullRequestFilter | null /* pullRequests_every */;
  branches?: _BranchFilter | null /* branches */;
  branches_not?: _BranchFilter | null /* branches_not */;
  branches_in?: _BranchFilter | null /* branches_in */;
  branches_not_in?: _BranchFilter | null /* branches_not_in */;
  branches_some?: _BranchFilter | null /* branches_some */;
  branches_none?: _BranchFilter | null /* branches_none */;
  branches_single?: _BranchFilter | null /* branches_single */;
  branches_every?: _BranchFilter | null /* branches_every */;
  links?: _ChannelLinkFilter | null /* links */;
  links_not?: _ChannelLinkFilter | null /* links_not */;
  links_in?: _ChannelLinkFilter | null /* links_in */;
  links_not_in?: _ChannelLinkFilter | null /* links_not_in */;
  links_some?: _ChannelLinkFilter | null /* links_some */;
  links_none?: _ChannelLinkFilter | null /* links_none */;
  links_single?: _ChannelLinkFilter | null /* links_single */;
  links_every?: _ChannelLinkFilter | null /* links_every */;
  webhook?: _WebhookFilter | null /* webhook */;
  webhook_not?: _WebhookFilter | null /* webhook_not */;
  webhook_in?: _WebhookFilter | null /* webhook_in */;
  webhook_not_in?: _WebhookFilter | null /* webhook_not_in */;
}
/* Filter Input Type for Label */
export interface _LabelFilter {
  AND?: _LabelFilter[] | null /* AND */;
  OR?: _LabelFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  default?: string | null /* default */;
  default_not?: string | null /* default_not */;
  default_in?: string[] | null /* default_in */;
  default_not_in?: string[] | null /* default_not_in */;
  default_lt?: string | null /* default_lt */;
  default_lte?: string | null /* default_lte */;
  default_gt?: string | null /* default_gt */;
  default_gte?: string | null /* default_gte */;
  default_contains?: string | null /* default_contains */;
  default_not_contains?: string | null /* default_not_contains */;
  default_starts_with?: string | null /* default_starts_with */;
  default_not_starts_with?: string | null /* default_not_starts_with */;
  default_ends_with?: string | null /* default_ends_with */;
  default_not_ends_with?: string | null /* default_not_ends_with */;
  color?: string | null /* color */;
  color_not?: string | null /* color_not */;
  color_in?: string[] | null /* color_in */;
  color_not_in?: string[] | null /* color_not_in */;
  color_lt?: string | null /* color_lt */;
  color_lte?: string | null /* color_lte */;
  color_gt?: string | null /* color_gt */;
  color_gte?: string | null /* color_gte */;
  color_contains?: string | null /* color_contains */;
  color_not_contains?: string | null /* color_not_contains */;
  color_starts_with?: string | null /* color_starts_with */;
  color_not_starts_with?: string | null /* color_not_starts_with */;
  color_ends_with?: string | null /* color_ends_with */;
  color_not_ends_with?: string | null /* color_not_ends_with */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
}
/* Filter Input Type for ChatChannel */
export interface _ChatChannelFilter {
  AND?: _ChatChannelFilter[] | null /* AND */;
  OR?: _ChatChannelFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  provider?: string | null /* provider */;
  provider_not?: string | null /* provider_not */;
  provider_in?: string[] | null /* provider_in */;
  provider_not_in?: string[] | null /* provider_not_in */;
  provider_lt?: string | null /* provider_lt */;
  provider_lte?: string | null /* provider_lte */;
  provider_gt?: string | null /* provider_gt */;
  provider_gte?: string | null /* provider_gte */;
  provider_contains?: string | null /* provider_contains */;
  provider_not_contains?: string | null /* provider_not_contains */;
  provider_starts_with?: string | null /* provider_starts_with */;
  provider_not_starts_with?: string | null /* provider_not_starts_with */;
  provider_ends_with?: string | null /* provider_ends_with */;
  provider_not_ends_with?: string | null /* provider_not_ends_with */;
  normalizedName?: string | null /* normalizedName */;
  normalizedName_not?: string | null /* normalizedName_not */;
  normalizedName_in?: string[] | null /* normalizedName_in */;
  normalizedName_not_in?: string[] | null /* normalizedName_not_in */;
  normalizedName_lt?: string | null /* normalizedName_lt */;
  normalizedName_lte?: string | null /* normalizedName_lte */;
  normalizedName_gt?: string | null /* normalizedName_gt */;
  normalizedName_gte?: string | null /* normalizedName_gte */;
  normalizedName_contains?: string | null /* normalizedName_contains */;
  normalizedName_not_contains?: string | null /* normalizedName_not_contains */;
  normalizedName_starts_with?: string | null /* normalizedName_starts_with */;
  normalizedName_not_starts_with?:
    | string
    | null /* normalizedName_not_starts_with */;
  normalizedName_ends_with?: string | null /* normalizedName_ends_with */;
  normalizedName_not_ends_with?:
    | string
    | null /* normalizedName_not_ends_with */;
  channelId?: string | null /* channelId */;
  channelId_not?: string | null /* channelId_not */;
  channelId_in?: string[] | null /* channelId_in */;
  channelId_not_in?: string[] | null /* channelId_not_in */;
  channelId_lt?: string | null /* channelId_lt */;
  channelId_lte?: string | null /* channelId_lte */;
  channelId_gt?: string | null /* channelId_gt */;
  channelId_gte?: string | null /* channelId_gte */;
  channelId_contains?: string | null /* channelId_contains */;
  channelId_not_contains?: string | null /* channelId_not_contains */;
  channelId_starts_with?: string | null /* channelId_starts_with */;
  channelId_not_starts_with?: string | null /* channelId_not_starts_with */;
  channelId_ends_with?: string | null /* channelId_ends_with */;
  channelId_not_ends_with?: string | null /* channelId_not_ends_with */;
  isDefault?: boolean | null /* isDefault */;
  isDefault_not?: boolean | null /* isDefault_not */;
  botInvitedSelf?: boolean | null /* botInvitedSelf */;
  botInvitedSelf_not?: boolean | null /* botInvitedSelf_not */;
  archived?: boolean | null /* archived */;
  archived_not?: boolean | null /* archived_not */;
  createdBy?: _ChatIdFilter | null /* createdBy */;
  createdBy_not?: _ChatIdFilter | null /* createdBy_not */;
  createdBy_in?: _ChatIdFilter | null /* createdBy_in */;
  createdBy_not_in?: _ChatIdFilter | null /* createdBy_not_in */;
  repos?: _RepoFilter | null /* repos */;
  repos_not?: _RepoFilter | null /* repos_not */;
  repos_in?: _RepoFilter | null /* repos_in */;
  repos_not_in?: _RepoFilter | null /* repos_not_in */;
  repos_some?: _RepoFilter | null /* repos_some */;
  repos_none?: _RepoFilter | null /* repos_none */;
  repos_single?: _RepoFilter | null /* repos_single */;
  repos_every?: _RepoFilter | null /* repos_every */;
  links?: _ChannelLinkFilter | null /* links */;
  links_not?: _ChannelLinkFilter | null /* links_not */;
  links_in?: _ChannelLinkFilter | null /* links_in */;
  links_not_in?: _ChannelLinkFilter | null /* links_not_in */;
  links_some?: _ChannelLinkFilter | null /* links_some */;
  links_none?: _ChannelLinkFilter | null /* links_none */;
  links_single?: _ChannelLinkFilter | null /* links_single */;
  links_every?: _ChannelLinkFilter | null /* links_every */;
  members?: _ChatIdFilter | null /* members */;
  members_not?: _ChatIdFilter | null /* members_not */;
  members_in?: _ChatIdFilter | null /* members_in */;
  members_not_in?: _ChatIdFilter | null /* members_not_in */;
  members_some?: _ChatIdFilter | null /* members_some */;
  members_none?: _ChatIdFilter | null /* members_none */;
  members_single?: _ChatIdFilter | null /* members_single */;
  members_every?: _ChatIdFilter | null /* members_every */;
  team?: _ChatTeamFilter | null /* team */;
  team_not?: _ChatTeamFilter | null /* team_not */;
  team_in?: _ChatTeamFilter | null /* team_in */;
  team_not_in?: _ChatTeamFilter | null /* team_not_in */;
}
/* Filter Input Type for ChatId */
export interface _ChatIdFilter {
  AND?: _ChatIdFilter[] | null /* AND */;
  OR?: _ChatIdFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  screenName?: string | null /* screenName */;
  screenName_not?: string | null /* screenName_not */;
  screenName_in?: string[] | null /* screenName_in */;
  screenName_not_in?: string[] | null /* screenName_not_in */;
  screenName_lt?: string | null /* screenName_lt */;
  screenName_lte?: string | null /* screenName_lte */;
  screenName_gt?: string | null /* screenName_gt */;
  screenName_gte?: string | null /* screenName_gte */;
  screenName_contains?: string | null /* screenName_contains */;
  screenName_not_contains?: string | null /* screenName_not_contains */;
  screenName_starts_with?: string | null /* screenName_starts_with */;
  screenName_not_starts_with?: string | null /* screenName_not_starts_with */;
  screenName_ends_with?: string | null /* screenName_ends_with */;
  screenName_not_ends_with?: string | null /* screenName_not_ends_with */;
  userId?: string | null /* userId */;
  userId_not?: string | null /* userId_not */;
  userId_in?: string[] | null /* userId_in */;
  userId_not_in?: string[] | null /* userId_not_in */;
  userId_lt?: string | null /* userId_lt */;
  userId_lte?: string | null /* userId_lte */;
  userId_gt?: string | null /* userId_gt */;
  userId_gte?: string | null /* userId_gte */;
  userId_contains?: string | null /* userId_contains */;
  userId_not_contains?: string | null /* userId_not_contains */;
  userId_starts_with?: string | null /* userId_starts_with */;
  userId_not_starts_with?: string | null /* userId_not_starts_with */;
  userId_ends_with?: string | null /* userId_ends_with */;
  userId_not_ends_with?: string | null /* userId_not_ends_with */;
  provider?: string | null /* provider */;
  provider_not?: string | null /* provider_not */;
  provider_in?: string[] | null /* provider_in */;
  provider_not_in?: string[] | null /* provider_not_in */;
  provider_lt?: string | null /* provider_lt */;
  provider_lte?: string | null /* provider_lte */;
  provider_gt?: string | null /* provider_gt */;
  provider_gte?: string | null /* provider_gte */;
  provider_contains?: string | null /* provider_contains */;
  provider_not_contains?: string | null /* provider_not_contains */;
  provider_starts_with?: string | null /* provider_starts_with */;
  provider_not_starts_with?: string | null /* provider_not_starts_with */;
  provider_ends_with?: string | null /* provider_ends_with */;
  provider_not_ends_with?: string | null /* provider_not_ends_with */;
  isAtomistBot?: string | null /* isAtomistBot */;
  isAtomistBot_not?: string | null /* isAtomistBot_not */;
  isAtomistBot_in?: string[] | null /* isAtomistBot_in */;
  isAtomistBot_not_in?: string[] | null /* isAtomistBot_not_in */;
  isAtomistBot_lt?: string | null /* isAtomistBot_lt */;
  isAtomistBot_lte?: string | null /* isAtomistBot_lte */;
  isAtomistBot_gt?: string | null /* isAtomistBot_gt */;
  isAtomistBot_gte?: string | null /* isAtomistBot_gte */;
  isAtomistBot_contains?: string | null /* isAtomistBot_contains */;
  isAtomistBot_not_contains?: string | null /* isAtomistBot_not_contains */;
  isAtomistBot_starts_with?: string | null /* isAtomistBot_starts_with */;
  isAtomistBot_not_starts_with?:
    | string
    | null /* isAtomistBot_not_starts_with */;
  isAtomistBot_ends_with?: string | null /* isAtomistBot_ends_with */;
  isAtomistBot_not_ends_with?: string | null /* isAtomistBot_not_ends_with */;
  isOwner?: string | null /* isOwner */;
  isOwner_not?: string | null /* isOwner_not */;
  isOwner_in?: string[] | null /* isOwner_in */;
  isOwner_not_in?: string[] | null /* isOwner_not_in */;
  isOwner_lt?: string | null /* isOwner_lt */;
  isOwner_lte?: string | null /* isOwner_lte */;
  isOwner_gt?: string | null /* isOwner_gt */;
  isOwner_gte?: string | null /* isOwner_gte */;
  isOwner_contains?: string | null /* isOwner_contains */;
  isOwner_not_contains?: string | null /* isOwner_not_contains */;
  isOwner_starts_with?: string | null /* isOwner_starts_with */;
  isOwner_not_starts_with?: string | null /* isOwner_not_starts_with */;
  isOwner_ends_with?: string | null /* isOwner_ends_with */;
  isOwner_not_ends_with?: string | null /* isOwner_not_ends_with */;
  isPrimaryOwner?: string | null /* isPrimaryOwner */;
  isPrimaryOwner_not?: string | null /* isPrimaryOwner_not */;
  isPrimaryOwner_in?: string[] | null /* isPrimaryOwner_in */;
  isPrimaryOwner_not_in?: string[] | null /* isPrimaryOwner_not_in */;
  isPrimaryOwner_lt?: string | null /* isPrimaryOwner_lt */;
  isPrimaryOwner_lte?: string | null /* isPrimaryOwner_lte */;
  isPrimaryOwner_gt?: string | null /* isPrimaryOwner_gt */;
  isPrimaryOwner_gte?: string | null /* isPrimaryOwner_gte */;
  isPrimaryOwner_contains?: string | null /* isPrimaryOwner_contains */;
  isPrimaryOwner_not_contains?: string | null /* isPrimaryOwner_not_contains */;
  isPrimaryOwner_starts_with?: string | null /* isPrimaryOwner_starts_with */;
  isPrimaryOwner_not_starts_with?:
    | string
    | null /* isPrimaryOwner_not_starts_with */;
  isPrimaryOwner_ends_with?: string | null /* isPrimaryOwner_ends_with */;
  isPrimaryOwner_not_ends_with?:
    | string
    | null /* isPrimaryOwner_not_ends_with */;
  isAdmin?: string | null /* isAdmin */;
  isAdmin_not?: string | null /* isAdmin_not */;
  isAdmin_in?: string[] | null /* isAdmin_in */;
  isAdmin_not_in?: string[] | null /* isAdmin_not_in */;
  isAdmin_lt?: string | null /* isAdmin_lt */;
  isAdmin_lte?: string | null /* isAdmin_lte */;
  isAdmin_gt?: string | null /* isAdmin_gt */;
  isAdmin_gte?: string | null /* isAdmin_gte */;
  isAdmin_contains?: string | null /* isAdmin_contains */;
  isAdmin_not_contains?: string | null /* isAdmin_not_contains */;
  isAdmin_starts_with?: string | null /* isAdmin_starts_with */;
  isAdmin_not_starts_with?: string | null /* isAdmin_not_starts_with */;
  isAdmin_ends_with?: string | null /* isAdmin_ends_with */;
  isAdmin_not_ends_with?: string | null /* isAdmin_not_ends_with */;
  isBot?: string | null /* isBot */;
  isBot_not?: string | null /* isBot_not */;
  isBot_in?: string[] | null /* isBot_in */;
  isBot_not_in?: string[] | null /* isBot_not_in */;
  isBot_lt?: string | null /* isBot_lt */;
  isBot_lte?: string | null /* isBot_lte */;
  isBot_gt?: string | null /* isBot_gt */;
  isBot_gte?: string | null /* isBot_gte */;
  isBot_contains?: string | null /* isBot_contains */;
  isBot_not_contains?: string | null /* isBot_not_contains */;
  isBot_starts_with?: string | null /* isBot_starts_with */;
  isBot_not_starts_with?: string | null /* isBot_not_starts_with */;
  isBot_ends_with?: string | null /* isBot_ends_with */;
  isBot_not_ends_with?: string | null /* isBot_not_ends_with */;
  timezoneLabel?: string | null /* timezoneLabel */;
  timezoneLabel_not?: string | null /* timezoneLabel_not */;
  timezoneLabel_in?: string[] | null /* timezoneLabel_in */;
  timezoneLabel_not_in?: string[] | null /* timezoneLabel_not_in */;
  timezoneLabel_lt?: string | null /* timezoneLabel_lt */;
  timezoneLabel_lte?: string | null /* timezoneLabel_lte */;
  timezoneLabel_gt?: string | null /* timezoneLabel_gt */;
  timezoneLabel_gte?: string | null /* timezoneLabel_gte */;
  timezoneLabel_contains?: string | null /* timezoneLabel_contains */;
  timezoneLabel_not_contains?: string | null /* timezoneLabel_not_contains */;
  timezoneLabel_starts_with?: string | null /* timezoneLabel_starts_with */;
  timezoneLabel_not_starts_with?:
    | string
    | null /* timezoneLabel_not_starts_with */;
  timezoneLabel_ends_with?: string | null /* timezoneLabel_ends_with */;
  timezoneLabel_not_ends_with?: string | null /* timezoneLabel_not_ends_with */;
  channels?: _ChatChannelFilter | null /* channels */;
  channels_not?: _ChatChannelFilter | null /* channels_not */;
  channels_in?: _ChatChannelFilter | null /* channels_in */;
  channels_not_in?: _ChatChannelFilter | null /* channels_not_in */;
  channels_some?: _ChatChannelFilter | null /* channels_some */;
  channels_none?: _ChatChannelFilter | null /* channels_none */;
  channels_single?: _ChatChannelFilter | null /* channels_single */;
  channels_every?: _ChatChannelFilter | null /* channels_every */;
  emails?: _EmailFilter | null /* emails */;
  emails_not?: _EmailFilter | null /* emails_not */;
  emails_in?: _EmailFilter | null /* emails_in */;
  emails_not_in?: _EmailFilter | null /* emails_not_in */;
  emails_some?: _EmailFilter | null /* emails_some */;
  emails_none?: _EmailFilter | null /* emails_none */;
  emails_single?: _EmailFilter | null /* emails_single */;
  emails_every?: _EmailFilter | null /* emails_every */;
  chatTeam?: _ChatTeamFilter | null /* chatTeam */;
  chatTeam_not?: _ChatTeamFilter | null /* chatTeam_not */;
  chatTeam_in?: _ChatTeamFilter | null /* chatTeam_in */;
  chatTeam_not_in?: _ChatTeamFilter | null /* chatTeam_not_in */;
  channelsCreated?: _ChatChannelFilter | null /* channelsCreated */;
  channelsCreated_not?: _ChatChannelFilter | null /* channelsCreated_not */;
  channelsCreated_in?: _ChatChannelFilter | null /* channelsCreated_in */;
  channelsCreated_not_in?: _ChatChannelFilter | null /* channelsCreated_not_in */;
  channelsCreated_some?: _ChatChannelFilter | null /* channelsCreated_some */;
  channelsCreated_none?: _ChatChannelFilter | null /* channelsCreated_none */;
  channelsCreated_single?: _ChatChannelFilter | null /* channelsCreated_single */;
  channelsCreated_every?: _ChatChannelFilter | null /* channelsCreated_every */;
  person?: _PersonFilter | null /* person */;
  person_not?: _PersonFilter | null /* person_not */;
  person_in?: _PersonFilter | null /* person_in */;
  person_not_in?: _PersonFilter | null /* person_not_in */;
}
/* Filter Input Type for Email */
export interface _EmailFilter {
  AND?: _EmailFilter[] | null /* AND */;
  OR?: _EmailFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  address?: string | null /* address */;
  address_not?: string | null /* address_not */;
  address_in?: string[] | null /* address_in */;
  address_not_in?: string[] | null /* address_not_in */;
  address_lt?: string | null /* address_lt */;
  address_lte?: string | null /* address_lte */;
  address_gt?: string | null /* address_gt */;
  address_gte?: string | null /* address_gte */;
  address_contains?: string | null /* address_contains */;
  address_not_contains?: string | null /* address_not_contains */;
  address_starts_with?: string | null /* address_starts_with */;
  address_not_starts_with?: string | null /* address_not_starts_with */;
  address_ends_with?: string | null /* address_ends_with */;
  address_not_ends_with?: string | null /* address_not_ends_with */;
  scmId?: _SCMIdFilter | null /* scmId */;
  scmId_not?: _SCMIdFilter | null /* scmId_not */;
  scmId_in?: _SCMIdFilter | null /* scmId_in */;
  scmId_not_in?: _SCMIdFilter | null /* scmId_not_in */;
  gitHubId?: _GitHubIdFilter | null /* gitHubId */;
  gitHubId_not?: _GitHubIdFilter | null /* gitHubId_not */;
  gitHubId_in?: _GitHubIdFilter | null /* gitHubId_in */;
  gitHubId_not_in?: _GitHubIdFilter | null /* gitHubId_not_in */;
  chatId?: _ChatIdFilter | null /* chatId */;
  chatId_not?: _ChatIdFilter | null /* chatId_not */;
  chatId_in?: _ChatIdFilter | null /* chatId_in */;
  chatId_not_in?: _ChatIdFilter | null /* chatId_not_in */;
  person?: _PersonFilter | null /* person */;
  person_not?: _PersonFilter | null /* person_not */;
  person_in?: _PersonFilter | null /* person_in */;
  person_not_in?: _PersonFilter | null /* person_not_in */;
}
/* Filter Input Type for SCMId */
export interface _SCMIdFilter {
  AND?: _SCMIdFilter[] | null /* AND */;
  OR?: _SCMIdFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  login?: string | null /* login */;
  login_not?: string | null /* login_not */;
  login_in?: string[] | null /* login_in */;
  login_not_in?: string[] | null /* login_not_in */;
  login_lt?: string | null /* login_lt */;
  login_lte?: string | null /* login_lte */;
  login_gt?: string | null /* login_gt */;
  login_gte?: string | null /* login_gte */;
  login_contains?: string | null /* login_contains */;
  login_not_contains?: string | null /* login_not_contains */;
  login_starts_with?: string | null /* login_starts_with */;
  login_not_starts_with?: string | null /* login_not_starts_with */;
  login_ends_with?: string | null /* login_ends_with */;
  login_not_ends_with?: string | null /* login_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  avatar?: string | null /* avatar */;
  avatar_not?: string | null /* avatar_not */;
  avatar_in?: string[] | null /* avatar_in */;
  avatar_not_in?: string[] | null /* avatar_not_in */;
  avatar_lt?: string | null /* avatar_lt */;
  avatar_lte?: string | null /* avatar_lte */;
  avatar_gt?: string | null /* avatar_gt */;
  avatar_gte?: string | null /* avatar_gte */;
  avatar_contains?: string | null /* avatar_contains */;
  avatar_not_contains?: string | null /* avatar_not_contains */;
  avatar_starts_with?: string | null /* avatar_starts_with */;
  avatar_not_starts_with?: string | null /* avatar_not_starts_with */;
  avatar_ends_with?: string | null /* avatar_ends_with */;
  avatar_not_ends_with?: string | null /* avatar_not_ends_with */;
  provider?: _GitHubProviderFilter | null /* provider */;
  provider_not?: _GitHubProviderFilter | null /* provider_not */;
  provider_in?: _GitHubProviderFilter | null /* provider_in */;
  provider_not_in?: _GitHubProviderFilter | null /* provider_not_in */;
  provider_some?: _GitHubProviderFilter | null /* provider_some */;
  provider_none?: _GitHubProviderFilter | null /* provider_none */;
  provider_single?: _GitHubProviderFilter | null /* provider_single */;
  provider_every?: _GitHubProviderFilter | null /* provider_every */;
  scmProvider?: _SCMProviderFilter | null /* scmProvider */;
  scmProvider_not?: _SCMProviderFilter | null /* scmProvider_not */;
  scmProvider_in?: _SCMProviderFilter | null /* scmProvider_in */;
  scmProvider_not_in?: _SCMProviderFilter | null /* scmProvider_not_in */;
  emails?: _EmailFilter | null /* emails */;
  emails_not?: _EmailFilter | null /* emails_not */;
  emails_in?: _EmailFilter | null /* emails_in */;
  emails_not_in?: _EmailFilter | null /* emails_not_in */;
  emails_some?: _EmailFilter | null /* emails_some */;
  emails_none?: _EmailFilter | null /* emails_none */;
  emails_single?: _EmailFilter | null /* emails_single */;
  emails_every?: _EmailFilter | null /* emails_every */;
  person?: _PersonFilter | null /* person */;
  person_not?: _PersonFilter | null /* person_not */;
  person_in?: _PersonFilter | null /* person_in */;
  person_not_in?: _PersonFilter | null /* person_not_in */;
}
/* Filter Input Type for GitHubProvider */
export interface _GitHubProviderFilter {
  AND?: _GitHubProviderFilter[] | null /* AND */;
  OR?: _GitHubProviderFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  url?: string | null /* url */;
  url_not?: string | null /* url_not */;
  url_in?: string[] | null /* url_in */;
  url_not_in?: string[] | null /* url_not_in */;
  url_lt?: string | null /* url_lt */;
  url_lte?: string | null /* url_lte */;
  url_gt?: string | null /* url_gt */;
  url_gte?: string | null /* url_gte */;
  url_contains?: string | null /* url_contains */;
  url_not_contains?: string | null /* url_not_contains */;
  url_starts_with?: string | null /* url_starts_with */;
  url_not_starts_with?: string | null /* url_not_starts_with */;
  url_ends_with?: string | null /* url_ends_with */;
  url_not_ends_with?: string | null /* url_not_ends_with */;
  providerId?: string | null /* providerId */;
  providerId_not?: string | null /* providerId_not */;
  providerId_in?: string[] | null /* providerId_in */;
  providerId_not_in?: string[] | null /* providerId_not_in */;
  providerId_lt?: string | null /* providerId_lt */;
  providerId_lte?: string | null /* providerId_lte */;
  providerId_gt?: string | null /* providerId_gt */;
  providerId_gte?: string | null /* providerId_gte */;
  providerId_contains?: string | null /* providerId_contains */;
  providerId_not_contains?: string | null /* providerId_not_contains */;
  providerId_starts_with?: string | null /* providerId_starts_with */;
  providerId_not_starts_with?: string | null /* providerId_not_starts_with */;
  providerId_ends_with?: string | null /* providerId_ends_with */;
  providerId_not_ends_with?: string | null /* providerId_not_ends_with */;
  apiUrl?: string | null /* apiUrl */;
  apiUrl_not?: string | null /* apiUrl_not */;
  apiUrl_in?: string[] | null /* apiUrl_in */;
  apiUrl_not_in?: string[] | null /* apiUrl_not_in */;
  apiUrl_lt?: string | null /* apiUrl_lt */;
  apiUrl_lte?: string | null /* apiUrl_lte */;
  apiUrl_gt?: string | null /* apiUrl_gt */;
  apiUrl_gte?: string | null /* apiUrl_gte */;
  apiUrl_contains?: string | null /* apiUrl_contains */;
  apiUrl_not_contains?: string | null /* apiUrl_not_contains */;
  apiUrl_starts_with?: string | null /* apiUrl_starts_with */;
  apiUrl_not_starts_with?: string | null /* apiUrl_not_starts_with */;
  apiUrl_ends_with?: string | null /* apiUrl_ends_with */;
  apiUrl_not_ends_with?: string | null /* apiUrl_not_ends_with */;
  gitUrl?: string | null /* gitUrl */;
  gitUrl_not?: string | null /* gitUrl_not */;
  gitUrl_in?: string[] | null /* gitUrl_in */;
  gitUrl_not_in?: string[] | null /* gitUrl_not_in */;
  gitUrl_lt?: string | null /* gitUrl_lt */;
  gitUrl_lte?: string | null /* gitUrl_lte */;
  gitUrl_gt?: string | null /* gitUrl_gt */;
  gitUrl_gte?: string | null /* gitUrl_gte */;
  gitUrl_contains?: string | null /* gitUrl_contains */;
  gitUrl_not_contains?: string | null /* gitUrl_not_contains */;
  gitUrl_starts_with?: string | null /* gitUrl_starts_with */;
  gitUrl_not_starts_with?: string | null /* gitUrl_not_starts_with */;
  gitUrl_ends_with?: string | null /* gitUrl_ends_with */;
  gitUrl_not_ends_with?: string | null /* gitUrl_not_ends_with */;
  providerType?: ProviderType | null /* providerType */;
  providerType_not?: ProviderType | null /* providerType_not */;
  providerType_in?: ProviderType[] | null /* providerType_in */;
  providerType_not_in?: ProviderType[] | null /* providerType_not_in */;
  team?: _TeamFilter | null /* team */;
  team_not?: _TeamFilter | null /* team_not */;
  team_in?: _TeamFilter | null /* team_in */;
  team_not_in?: _TeamFilter | null /* team_not_in */;
}
/* Filter Input Type for Team */
export interface _TeamFilter {
  AND?: _TeamFilter[] | null /* AND */;
  OR?: _TeamFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  description?: string | null /* description */;
  description_not?: string | null /* description_not */;
  description_in?: string[] | null /* description_in */;
  description_not_in?: string[] | null /* description_not_in */;
  description_lt?: string | null /* description_lt */;
  description_lte?: string | null /* description_lte */;
  description_gt?: string | null /* description_gt */;
  description_gte?: string | null /* description_gte */;
  description_contains?: string | null /* description_contains */;
  description_not_contains?: string | null /* description_not_contains */;
  description_starts_with?: string | null /* description_starts_with */;
  description_not_starts_with?: string | null /* description_not_starts_with */;
  description_ends_with?: string | null /* description_ends_with */;
  description_not_ends_with?: string | null /* description_not_ends_with */;
  iconUrl?: string | null /* iconUrl */;
  iconUrl_not?: string | null /* iconUrl_not */;
  iconUrl_in?: string[] | null /* iconUrl_in */;
  iconUrl_not_in?: string[] | null /* iconUrl_not_in */;
  iconUrl_lt?: string | null /* iconUrl_lt */;
  iconUrl_lte?: string | null /* iconUrl_lte */;
  iconUrl_gt?: string | null /* iconUrl_gt */;
  iconUrl_gte?: string | null /* iconUrl_gte */;
  iconUrl_contains?: string | null /* iconUrl_contains */;
  iconUrl_not_contains?: string | null /* iconUrl_not_contains */;
  iconUrl_starts_with?: string | null /* iconUrl_starts_with */;
  iconUrl_not_starts_with?: string | null /* iconUrl_not_starts_with */;
  iconUrl_ends_with?: string | null /* iconUrl_ends_with */;
  iconUrl_not_ends_with?: string | null /* iconUrl_not_ends_with */;
  createdAt?: string | null /* createdAt */;
  createdAt_not?: string | null /* createdAt_not */;
  createdAt_in?: string[] | null /* createdAt_in */;
  createdAt_not_in?: string[] | null /* createdAt_not_in */;
  createdAt_lt?: string | null /* createdAt_lt */;
  createdAt_lte?: string | null /* createdAt_lte */;
  createdAt_gt?: string | null /* createdAt_gt */;
  createdAt_gte?: string | null /* createdAt_gte */;
  createdAt_contains?: string | null /* createdAt_contains */;
  createdAt_not_contains?: string | null /* createdAt_not_contains */;
  createdAt_starts_with?: string | null /* createdAt_starts_with */;
  createdAt_not_starts_with?: string | null /* createdAt_not_starts_with */;
  createdAt_ends_with?: string | null /* createdAt_ends_with */;
  createdAt_not_ends_with?: string | null /* createdAt_not_ends_with */;
  persons?: _PersonFilter | null /* persons */;
  persons_not?: _PersonFilter | null /* persons_not */;
  persons_in?: _PersonFilter | null /* persons_in */;
  persons_not_in?: _PersonFilter | null /* persons_not_in */;
  persons_some?: _PersonFilter | null /* persons_some */;
  persons_none?: _PersonFilter | null /* persons_none */;
  persons_single?: _PersonFilter | null /* persons_single */;
  persons_every?: _PersonFilter | null /* persons_every */;
  orgs?: _OrgFilter | null /* orgs */;
  orgs_not?: _OrgFilter | null /* orgs_not */;
  orgs_in?: _OrgFilter | null /* orgs_in */;
  orgs_not_in?: _OrgFilter | null /* orgs_not_in */;
  orgs_some?: _OrgFilter | null /* orgs_some */;
  orgs_none?: _OrgFilter | null /* orgs_none */;
  orgs_single?: _OrgFilter | null /* orgs_single */;
  orgs_every?: _OrgFilter | null /* orgs_every */;
  providers?: _GitHubProviderFilter | null /* providers */;
  providers_not?: _GitHubProviderFilter | null /* providers_not */;
  providers_in?: _GitHubProviderFilter | null /* providers_in */;
  providers_not_in?: _GitHubProviderFilter | null /* providers_not_in */;
  providers_some?: _GitHubProviderFilter | null /* providers_some */;
  providers_none?: _GitHubProviderFilter | null /* providers_none */;
  providers_single?: _GitHubProviderFilter | null /* providers_single */;
  providers_every?: _GitHubProviderFilter | null /* providers_every */;
  scmProviders?: _SCMProviderFilter | null /* scmProviders */;
  scmProviders_not?: _SCMProviderFilter | null /* scmProviders_not */;
  scmProviders_in?: _SCMProviderFilter | null /* scmProviders_in */;
  scmProviders_not_in?: _SCMProviderFilter | null /* scmProviders_not_in */;
  scmProviders_some?: _SCMProviderFilter | null /* scmProviders_some */;
  scmProviders_none?: _SCMProviderFilter | null /* scmProviders_none */;
  scmProviders_single?: _SCMProviderFilter | null /* scmProviders_single */;
  scmProviders_every?: _SCMProviderFilter | null /* scmProviders_every */;
  chatTeams?: _ChatTeamFilter | null /* chatTeams */;
  chatTeams_not?: _ChatTeamFilter | null /* chatTeams_not */;
  chatTeams_in?: _ChatTeamFilter | null /* chatTeams_in */;
  chatTeams_not_in?: _ChatTeamFilter | null /* chatTeams_not_in */;
  chatTeams_some?: _ChatTeamFilter | null /* chatTeams_some */;
  chatTeams_none?: _ChatTeamFilter | null /* chatTeams_none */;
  chatTeams_single?: _ChatTeamFilter | null /* chatTeams_single */;
  chatTeams_every?: _ChatTeamFilter | null /* chatTeams_every */;
}
/* Filter Input Type for Person */
export interface _PersonFilter {
  AND?: _PersonFilter[] | null /* AND */;
  OR?: _PersonFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  forename?: string | null /* forename */;
  forename_not?: string | null /* forename_not */;
  forename_in?: string[] | null /* forename_in */;
  forename_not_in?: string[] | null /* forename_not_in */;
  forename_lt?: string | null /* forename_lt */;
  forename_lte?: string | null /* forename_lte */;
  forename_gt?: string | null /* forename_gt */;
  forename_gte?: string | null /* forename_gte */;
  forename_contains?: string | null /* forename_contains */;
  forename_not_contains?: string | null /* forename_not_contains */;
  forename_starts_with?: string | null /* forename_starts_with */;
  forename_not_starts_with?: string | null /* forename_not_starts_with */;
  forename_ends_with?: string | null /* forename_ends_with */;
  forename_not_ends_with?: string | null /* forename_not_ends_with */;
  surname?: string | null /* surname */;
  surname_not?: string | null /* surname_not */;
  surname_in?: string[] | null /* surname_in */;
  surname_not_in?: string[] | null /* surname_not_in */;
  surname_lt?: string | null /* surname_lt */;
  surname_lte?: string | null /* surname_lte */;
  surname_gt?: string | null /* surname_gt */;
  surname_gte?: string | null /* surname_gte */;
  surname_contains?: string | null /* surname_contains */;
  surname_not_contains?: string | null /* surname_not_contains */;
  surname_starts_with?: string | null /* surname_starts_with */;
  surname_not_starts_with?: string | null /* surname_not_starts_with */;
  surname_ends_with?: string | null /* surname_ends_with */;
  surname_not_ends_with?: string | null /* surname_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  scmId?: _SCMIdFilter | null /* scmId */;
  scmId_not?: _SCMIdFilter | null /* scmId_not */;
  scmId_in?: _SCMIdFilter | null /* scmId_in */;
  scmId_not_in?: _SCMIdFilter | null /* scmId_not_in */;
  gitHubId?: _GitHubIdFilter | null /* gitHubId */;
  gitHubId_not?: _GitHubIdFilter | null /* gitHubId_not */;
  gitHubId_in?: _GitHubIdFilter | null /* gitHubId_in */;
  gitHubId_not_in?: _GitHubIdFilter | null /* gitHubId_not_in */;
  chatId?: _ChatIdFilter | null /* chatId */;
  chatId_not?: _ChatIdFilter | null /* chatId_not */;
  chatId_in?: _ChatIdFilter | null /* chatId_in */;
  chatId_not_in?: _ChatIdFilter | null /* chatId_not_in */;
  emails?: _EmailFilter | null /* emails */;
  emails_not?: _EmailFilter | null /* emails_not */;
  emails_in?: _EmailFilter | null /* emails_in */;
  emails_not_in?: _EmailFilter | null /* emails_not_in */;
  emails_some?: _EmailFilter | null /* emails_some */;
  emails_none?: _EmailFilter | null /* emails_none */;
  emails_single?: _EmailFilter | null /* emails_single */;
  emails_every?: _EmailFilter | null /* emails_every */;
  team?: _TeamFilter | null /* team */;
  team_not?: _TeamFilter | null /* team_not */;
  team_in?: _TeamFilter | null /* team_in */;
  team_not_in?: _TeamFilter | null /* team_not_in */;
}
/* Filter Input Type for GitHubId */
export interface _GitHubIdFilter {
  AND?: _GitHubIdFilter[] | null /* AND */;
  OR?: _GitHubIdFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  login?: string | null /* login */;
  login_not?: string | null /* login_not */;
  login_in?: string[] | null /* login_in */;
  login_not_in?: string[] | null /* login_not_in */;
  login_lt?: string | null /* login_lt */;
  login_lte?: string | null /* login_lte */;
  login_gt?: string | null /* login_gt */;
  login_gte?: string | null /* login_gte */;
  login_contains?: string | null /* login_contains */;
  login_not_contains?: string | null /* login_not_contains */;
  login_starts_with?: string | null /* login_starts_with */;
  login_not_starts_with?: string | null /* login_not_starts_with */;
  login_ends_with?: string | null /* login_ends_with */;
  login_not_ends_with?: string | null /* login_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  provider?: _GitHubProviderFilter | null /* provider */;
  provider_not?: _GitHubProviderFilter | null /* provider_not */;
  provider_in?: _GitHubProviderFilter | null /* provider_in */;
  provider_not_in?: _GitHubProviderFilter | null /* provider_not_in */;
  provider_some?: _GitHubProviderFilter | null /* provider_some */;
  provider_none?: _GitHubProviderFilter | null /* provider_none */;
  provider_single?: _GitHubProviderFilter | null /* provider_single */;
  provider_every?: _GitHubProviderFilter | null /* provider_every */;
  scmProvider?: _SCMProviderFilter | null /* scmProvider */;
  scmProvider_not?: _SCMProviderFilter | null /* scmProvider_not */;
  scmProvider_in?: _SCMProviderFilter | null /* scmProvider_in */;
  scmProvider_not_in?: _SCMProviderFilter | null /* scmProvider_not_in */;
  emails?: _EmailFilter | null /* emails */;
  emails_not?: _EmailFilter | null /* emails_not */;
  emails_in?: _EmailFilter | null /* emails_in */;
  emails_not_in?: _EmailFilter | null /* emails_not_in */;
  emails_some?: _EmailFilter | null /* emails_some */;
  emails_none?: _EmailFilter | null /* emails_none */;
  emails_single?: _EmailFilter | null /* emails_single */;
  emails_every?: _EmailFilter | null /* emails_every */;
  person?: _PersonFilter | null /* person */;
  person_not?: _PersonFilter | null /* person_not */;
  person_in?: _PersonFilter | null /* person_in */;
  person_not_in?: _PersonFilter | null /* person_not_in */;
}
/* Filter Input Type for SCMProvider */
export interface _SCMProviderFilter {
  AND?: _SCMProviderFilter[] | null /* AND */;
  OR?: _SCMProviderFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  url?: string | null /* url */;
  url_not?: string | null /* url_not */;
  url_in?: string[] | null /* url_in */;
  url_not_in?: string[] | null /* url_not_in */;
  url_lt?: string | null /* url_lt */;
  url_lte?: string | null /* url_lte */;
  url_gt?: string | null /* url_gt */;
  url_gte?: string | null /* url_gte */;
  url_contains?: string | null /* url_contains */;
  url_not_contains?: string | null /* url_not_contains */;
  url_starts_with?: string | null /* url_starts_with */;
  url_not_starts_with?: string | null /* url_not_starts_with */;
  url_ends_with?: string | null /* url_ends_with */;
  url_not_ends_with?: string | null /* url_not_ends_with */;
  providerId?: string | null /* providerId */;
  providerId_not?: string | null /* providerId_not */;
  providerId_in?: string[] | null /* providerId_in */;
  providerId_not_in?: string[] | null /* providerId_not_in */;
  providerId_lt?: string | null /* providerId_lt */;
  providerId_lte?: string | null /* providerId_lte */;
  providerId_gt?: string | null /* providerId_gt */;
  providerId_gte?: string | null /* providerId_gte */;
  providerId_contains?: string | null /* providerId_contains */;
  providerId_not_contains?: string | null /* providerId_not_contains */;
  providerId_starts_with?: string | null /* providerId_starts_with */;
  providerId_not_starts_with?: string | null /* providerId_not_starts_with */;
  providerId_ends_with?: string | null /* providerId_ends_with */;
  providerId_not_ends_with?: string | null /* providerId_not_ends_with */;
  apiUrl?: string | null /* apiUrl */;
  apiUrl_not?: string | null /* apiUrl_not */;
  apiUrl_in?: string[] | null /* apiUrl_in */;
  apiUrl_not_in?: string[] | null /* apiUrl_not_in */;
  apiUrl_lt?: string | null /* apiUrl_lt */;
  apiUrl_lte?: string | null /* apiUrl_lte */;
  apiUrl_gt?: string | null /* apiUrl_gt */;
  apiUrl_gte?: string | null /* apiUrl_gte */;
  apiUrl_contains?: string | null /* apiUrl_contains */;
  apiUrl_not_contains?: string | null /* apiUrl_not_contains */;
  apiUrl_starts_with?: string | null /* apiUrl_starts_with */;
  apiUrl_not_starts_with?: string | null /* apiUrl_not_starts_with */;
  apiUrl_ends_with?: string | null /* apiUrl_ends_with */;
  apiUrl_not_ends_with?: string | null /* apiUrl_not_ends_with */;
  gitUrl?: string | null /* gitUrl */;
  gitUrl_not?: string | null /* gitUrl_not */;
  gitUrl_in?: string[] | null /* gitUrl_in */;
  gitUrl_not_in?: string[] | null /* gitUrl_not_in */;
  gitUrl_lt?: string | null /* gitUrl_lt */;
  gitUrl_lte?: string | null /* gitUrl_lte */;
  gitUrl_gt?: string | null /* gitUrl_gt */;
  gitUrl_gte?: string | null /* gitUrl_gte */;
  gitUrl_contains?: string | null /* gitUrl_contains */;
  gitUrl_not_contains?: string | null /* gitUrl_not_contains */;
  gitUrl_starts_with?: string | null /* gitUrl_starts_with */;
  gitUrl_not_starts_with?: string | null /* gitUrl_not_starts_with */;
  gitUrl_ends_with?: string | null /* gitUrl_ends_with */;
  gitUrl_not_ends_with?: string | null /* gitUrl_not_ends_with */;
  providerType?: ProviderType | null /* providerType */;
  providerType_not?: ProviderType | null /* providerType_not */;
  providerType_in?: ProviderType[] | null /* providerType_in */;
  providerType_not_in?: ProviderType[] | null /* providerType_not_in */;
  team?: _TeamFilter | null /* team */;
  team_not?: _TeamFilter | null /* team_not */;
  team_in?: _TeamFilter | null /* team_in */;
  team_not_in?: _TeamFilter | null /* team_not_in */;
}
/* Filter Input Type for Org */
export interface _OrgFilter {
  AND?: _OrgFilter[] | null /* AND */;
  OR?: _OrgFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  owner?: string | null /* owner */;
  owner_not?: string | null /* owner_not */;
  owner_in?: string[] | null /* owner_in */;
  owner_not_in?: string[] | null /* owner_not_in */;
  owner_lt?: string | null /* owner_lt */;
  owner_lte?: string | null /* owner_lte */;
  owner_gt?: string | null /* owner_gt */;
  owner_gte?: string | null /* owner_gte */;
  owner_contains?: string | null /* owner_contains */;
  owner_not_contains?: string | null /* owner_not_contains */;
  owner_starts_with?: string | null /* owner_starts_with */;
  owner_not_starts_with?: string | null /* owner_not_starts_with */;
  owner_ends_with?: string | null /* owner_ends_with */;
  owner_not_ends_with?: string | null /* owner_not_ends_with */;
  ownerType?: OwnerType | null /* ownerType */;
  ownerType_not?: OwnerType | null /* ownerType_not */;
  ownerType_in?: OwnerType[] | null /* ownerType_in */;
  ownerType_not_in?: OwnerType[] | null /* ownerType_not_in */;
  provider?: _GitHubProviderFilter | null /* provider */;
  provider_not?: _GitHubProviderFilter | null /* provider_not */;
  provider_in?: _GitHubProviderFilter | null /* provider_in */;
  provider_not_in?: _GitHubProviderFilter | null /* provider_not_in */;
  scmProvider?: _SCMProviderFilter | null /* scmProvider */;
  scmProvider_not?: _SCMProviderFilter | null /* scmProvider_not */;
  scmProvider_in?: _SCMProviderFilter | null /* scmProvider_in */;
  scmProvider_not_in?: _SCMProviderFilter | null /* scmProvider_not_in */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
  repo_some?: _RepoFilter | null /* repo_some */;
  repo_none?: _RepoFilter | null /* repo_none */;
  repo_single?: _RepoFilter | null /* repo_single */;
  repo_every?: _RepoFilter | null /* repo_every */;
  repos?: _RepoFilter | null /* repos */;
  repos_not?: _RepoFilter | null /* repos_not */;
  repos_in?: _RepoFilter | null /* repos_in */;
  repos_not_in?: _RepoFilter | null /* repos_not_in */;
  repos_some?: _RepoFilter | null /* repos_some */;
  repos_none?: _RepoFilter | null /* repos_none */;
  repos_single?: _RepoFilter | null /* repos_single */;
  repos_every?: _RepoFilter | null /* repos_every */;
  webhook?: _GitHubOrgWebhookFilter | null /* webhook */;
  webhook_not?: _GitHubOrgWebhookFilter | null /* webhook_not */;
  webhook_in?: _GitHubOrgWebhookFilter | null /* webhook_in */;
  webhook_not_in?: _GitHubOrgWebhookFilter | null /* webhook_not_in */;
  webhook_some?: _GitHubOrgWebhookFilter | null /* webhook_some */;
  webhook_none?: _GitHubOrgWebhookFilter | null /* webhook_none */;
  webhook_single?: _GitHubOrgWebhookFilter | null /* webhook_single */;
  webhook_every?: _GitHubOrgWebhookFilter | null /* webhook_every */;
  webhooks?: _WebhookFilter | null /* webhooks */;
  webhooks_not?: _WebhookFilter | null /* webhooks_not */;
  webhooks_in?: _WebhookFilter | null /* webhooks_in */;
  webhooks_not_in?: _WebhookFilter | null /* webhooks_not_in */;
  webhooks_some?: _WebhookFilter | null /* webhooks_some */;
  webhooks_none?: _WebhookFilter | null /* webhooks_none */;
  webhooks_single?: _WebhookFilter | null /* webhooks_single */;
  webhooks_every?: _WebhookFilter | null /* webhooks_every */;
  chatTeam?: _ChatTeamFilter | null /* chatTeam */;
  chatTeam_not?: _ChatTeamFilter | null /* chatTeam_not */;
  chatTeam_in?: _ChatTeamFilter | null /* chatTeam_in */;
  chatTeam_not_in?: _ChatTeamFilter | null /* chatTeam_not_in */;
  team?: _TeamFilter | null /* team */;
  team_not?: _TeamFilter | null /* team_not */;
  team_in?: _TeamFilter | null /* team_in */;
  team_not_in?: _TeamFilter | null /* team_not_in */;
}
/* Filter Input Type for GitHubOrgWebhook */
export interface _GitHubOrgWebhookFilter {
  AND?: _GitHubOrgWebhookFilter[] | null /* AND */;
  OR?: _GitHubOrgWebhookFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  url?: string | null /* url */;
  url_not?: string | null /* url_not */;
  url_in?: string[] | null /* url_in */;
  url_not_in?: string[] | null /* url_not_in */;
  url_lt?: string | null /* url_lt */;
  url_lte?: string | null /* url_lte */;
  url_gt?: string | null /* url_gt */;
  url_gte?: string | null /* url_gte */;
  url_contains?: string | null /* url_contains */;
  url_not_contains?: string | null /* url_not_contains */;
  url_starts_with?: string | null /* url_starts_with */;
  url_not_starts_with?: string | null /* url_not_starts_with */;
  url_ends_with?: string | null /* url_ends_with */;
  url_not_ends_with?: string | null /* url_not_ends_with */;
  webhookType?: WebhookType | null /* webhookType */;
  webhookType_not?: WebhookType | null /* webhookType_not */;
  webhookType_in?: WebhookType[] | null /* webhookType_in */;
  webhookType_not_in?: WebhookType[] | null /* webhookType_not_in */;
  org?: _OrgFilter | null /* org */;
  org_not?: _OrgFilter | null /* org_not */;
  org_in?: _OrgFilter | null /* org_in */;
  org_not_in?: _OrgFilter | null /* org_not_in */;
}
/* Filter Input Type for Webhook */
export interface _WebhookFilter {
  AND?: _WebhookFilter[] | null /* AND */;
  OR?: _WebhookFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  url?: string | null /* url */;
  url_not?: string | null /* url_not */;
  url_in?: string[] | null /* url_in */;
  url_not_in?: string[] | null /* url_not_in */;
  url_lt?: string | null /* url_lt */;
  url_lte?: string | null /* url_lte */;
  url_gt?: string | null /* url_gt */;
  url_gte?: string | null /* url_gte */;
  url_contains?: string | null /* url_contains */;
  url_not_contains?: string | null /* url_not_contains */;
  url_starts_with?: string | null /* url_starts_with */;
  url_not_starts_with?: string | null /* url_not_starts_with */;
  url_ends_with?: string | null /* url_ends_with */;
  url_not_ends_with?: string | null /* url_not_ends_with */;
  webhookType?: WebhookType | null /* webhookType */;
  webhookType_not?: WebhookType | null /* webhookType_not */;
  webhookType_in?: WebhookType[] | null /* webhookType_in */;
  webhookType_not_in?: WebhookType[] | null /* webhookType_not_in */;
  org?: _OrgFilter | null /* org */;
  org_not?: _OrgFilter | null /* org_not */;
  org_in?: _OrgFilter | null /* org_in */;
  org_not_in?: _OrgFilter | null /* org_not_in */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
}
/* Filter Input Type for ChatTeam */
export interface _ChatTeamFilter {
  AND?: _ChatTeamFilter[] | null /* AND */;
  OR?: _ChatTeamFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  provider?: string | null /* provider */;
  provider_not?: string | null /* provider_not */;
  provider_in?: string[] | null /* provider_in */;
  provider_not_in?: string[] | null /* provider_not_in */;
  provider_lt?: string | null /* provider_lt */;
  provider_lte?: string | null /* provider_lte */;
  provider_gt?: string | null /* provider_gt */;
  provider_gte?: string | null /* provider_gte */;
  provider_contains?: string | null /* provider_contains */;
  provider_not_contains?: string | null /* provider_not_contains */;
  provider_starts_with?: string | null /* provider_starts_with */;
  provider_not_starts_with?: string | null /* provider_not_starts_with */;
  provider_ends_with?: string | null /* provider_ends_with */;
  provider_not_ends_with?: string | null /* provider_not_ends_with */;
  domain?: string | null /* domain */;
  domain_not?: string | null /* domain_not */;
  domain_in?: string[] | null /* domain_in */;
  domain_not_in?: string[] | null /* domain_not_in */;
  domain_lt?: string | null /* domain_lt */;
  domain_lte?: string | null /* domain_lte */;
  domain_gt?: string | null /* domain_gt */;
  domain_gte?: string | null /* domain_gte */;
  domain_contains?: string | null /* domain_contains */;
  domain_not_contains?: string | null /* domain_not_contains */;
  domain_starts_with?: string | null /* domain_starts_with */;
  domain_not_starts_with?: string | null /* domain_not_starts_with */;
  domain_ends_with?: string | null /* domain_ends_with */;
  domain_not_ends_with?: string | null /* domain_not_ends_with */;
  messageCount?: number | null /* messageCount */;
  messageCount_not?: number | null /* messageCount_not */;
  messageCount_in?: number[] | null /* messageCount_in */;
  messageCount_not_in?: number[] | null /* messageCount_not_in */;
  messageCount_lt?: number | null /* messageCount_lt */;
  messageCount_lte?: number | null /* messageCount_lte */;
  messageCount_gt?: number | null /* messageCount_gt */;
  messageCount_gte?: number | null /* messageCount_gte */;
  emailDomain?: string | null /* emailDomain */;
  emailDomain_not?: string | null /* emailDomain_not */;
  emailDomain_in?: string[] | null /* emailDomain_in */;
  emailDomain_not_in?: string[] | null /* emailDomain_not_in */;
  emailDomain_lt?: string | null /* emailDomain_lt */;
  emailDomain_lte?: string | null /* emailDomain_lte */;
  emailDomain_gt?: string | null /* emailDomain_gt */;
  emailDomain_gte?: string | null /* emailDomain_gte */;
  emailDomain_contains?: string | null /* emailDomain_contains */;
  emailDomain_not_contains?: string | null /* emailDomain_not_contains */;
  emailDomain_starts_with?: string | null /* emailDomain_starts_with */;
  emailDomain_not_starts_with?: string | null /* emailDomain_not_starts_with */;
  emailDomain_ends_with?: string | null /* emailDomain_ends_with */;
  emailDomain_not_ends_with?: string | null /* emailDomain_not_ends_with */;
  orgs?: _OrgFilter | null /* orgs */;
  orgs_not?: _OrgFilter | null /* orgs_not */;
  orgs_in?: _OrgFilter | null /* orgs_in */;
  orgs_not_in?: _OrgFilter | null /* orgs_not_in */;
  orgs_some?: _OrgFilter | null /* orgs_some */;
  orgs_none?: _OrgFilter | null /* orgs_none */;
  orgs_single?: _OrgFilter | null /* orgs_single */;
  orgs_every?: _OrgFilter | null /* orgs_every */;
  providers?: _GitHubProviderFilter | null /* providers */;
  providers_not?: _GitHubProviderFilter | null /* providers_not */;
  providers_in?: _GitHubProviderFilter | null /* providers_in */;
  providers_not_in?: _GitHubProviderFilter | null /* providers_not_in */;
  providers_some?: _GitHubProviderFilter | null /* providers_some */;
  providers_none?: _GitHubProviderFilter | null /* providers_none */;
  providers_single?: _GitHubProviderFilter | null /* providers_single */;
  providers_every?: _GitHubProviderFilter | null /* providers_every */;
  scmProviders?: _SCMProviderFilter | null /* scmProviders */;
  scmProviders_not?: _SCMProviderFilter | null /* scmProviders_not */;
  scmProviders_in?: _SCMProviderFilter | null /* scmProviders_in */;
  scmProviders_not_in?: _SCMProviderFilter | null /* scmProviders_not_in */;
  scmProviders_some?: _SCMProviderFilter | null /* scmProviders_some */;
  scmProviders_none?: _SCMProviderFilter | null /* scmProviders_none */;
  scmProviders_single?: _SCMProviderFilter | null /* scmProviders_single */;
  scmProviders_every?: _SCMProviderFilter | null /* scmProviders_every */;
  channels?: _ChatChannelFilter | null /* channels */;
  channels_not?: _ChatChannelFilter | null /* channels_not */;
  channels_in?: _ChatChannelFilter | null /* channels_in */;
  channels_not_in?: _ChatChannelFilter | null /* channels_not_in */;
  channels_some?: _ChatChannelFilter | null /* channels_some */;
  channels_none?: _ChatChannelFilter | null /* channels_none */;
  channels_single?: _ChatChannelFilter | null /* channels_single */;
  channels_every?: _ChatChannelFilter | null /* channels_every */;
  members?: _ChatIdFilter | null /* members */;
  members_not?: _ChatIdFilter | null /* members_not */;
  members_in?: _ChatIdFilter | null /* members_in */;
  members_not_in?: _ChatIdFilter | null /* members_not_in */;
  members_some?: _ChatIdFilter | null /* members_some */;
  members_none?: _ChatIdFilter | null /* members_none */;
  members_single?: _ChatIdFilter | null /* members_single */;
  members_every?: _ChatIdFilter | null /* members_every */;
  team?: _TeamFilter | null /* team */;
  team_not?: _TeamFilter | null /* team_not */;
  team_in?: _TeamFilter | null /* team_in */;
  team_not_in?: _TeamFilter | null /* team_not_in */;
}
/* Filter Input Type for ChannelLink */
export interface _ChannelLinkFilter {
  AND?: _ChannelLinkFilter[] | null /* AND */;
  OR?: _ChannelLinkFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  channel?: _ChatChannelFilter | null /* channel */;
  channel_not?: _ChatChannelFilter | null /* channel_not */;
  channel_in?: _ChatChannelFilter | null /* channel_in */;
  channel_not_in?: _ChatChannelFilter | null /* channel_not_in */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
}
/* Filter Input Type for PullRequest */
export interface _PullRequestFilter {
  AND?: _PullRequestFilter[] | null /* AND */;
  OR?: _PullRequestFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  number?: number | null /* number */;
  number_not?: number | null /* number_not */;
  number_in?: number[] | null /* number_in */;
  number_not_in?: number[] | null /* number_not_in */;
  number_lt?: number | null /* number_lt */;
  number_lte?: number | null /* number_lte */;
  number_gt?: number | null /* number_gt */;
  number_gte?: number | null /* number_gte */;
  prId?: string | null /* prId */;
  prId_not?: string | null /* prId_not */;
  prId_in?: string[] | null /* prId_in */;
  prId_not_in?: string[] | null /* prId_not_in */;
  prId_lt?: string | null /* prId_lt */;
  prId_lte?: string | null /* prId_lte */;
  prId_gt?: string | null /* prId_gt */;
  prId_gte?: string | null /* prId_gte */;
  prId_contains?: string | null /* prId_contains */;
  prId_not_contains?: string | null /* prId_not_contains */;
  prId_starts_with?: string | null /* prId_starts_with */;
  prId_not_starts_with?: string | null /* prId_not_starts_with */;
  prId_ends_with?: string | null /* prId_ends_with */;
  prId_not_ends_with?: string | null /* prId_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  body?: string | null /* body */;
  body_not?: string | null /* body_not */;
  body_in?: string[] | null /* body_in */;
  body_not_in?: string[] | null /* body_not_in */;
  body_lt?: string | null /* body_lt */;
  body_lte?: string | null /* body_lte */;
  body_gt?: string | null /* body_gt */;
  body_gte?: string | null /* body_gte */;
  body_contains?: string | null /* body_contains */;
  body_not_contains?: string | null /* body_not_contains */;
  body_starts_with?: string | null /* body_starts_with */;
  body_not_starts_with?: string | null /* body_not_starts_with */;
  body_ends_with?: string | null /* body_ends_with */;
  body_not_ends_with?: string | null /* body_not_ends_with */;
  state?: string | null /* state */;
  state_not?: string | null /* state_not */;
  state_in?: string[] | null /* state_in */;
  state_not_in?: string[] | null /* state_not_in */;
  state_lt?: string | null /* state_lt */;
  state_lte?: string | null /* state_lte */;
  state_gt?: string | null /* state_gt */;
  state_gte?: string | null /* state_gte */;
  state_contains?: string | null /* state_contains */;
  state_not_contains?: string | null /* state_not_contains */;
  state_starts_with?: string | null /* state_starts_with */;
  state_not_starts_with?: string | null /* state_not_starts_with */;
  state_ends_with?: string | null /* state_ends_with */;
  state_not_ends_with?: string | null /* state_not_ends_with */;
  merged?: boolean | null /* merged */;
  merged_not?: boolean | null /* merged_not */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  baseBranchName?: string | null /* baseBranchName */;
  baseBranchName_not?: string | null /* baseBranchName_not */;
  baseBranchName_in?: string[] | null /* baseBranchName_in */;
  baseBranchName_not_in?: string[] | null /* baseBranchName_not_in */;
  baseBranchName_lt?: string | null /* baseBranchName_lt */;
  baseBranchName_lte?: string | null /* baseBranchName_lte */;
  baseBranchName_gt?: string | null /* baseBranchName_gt */;
  baseBranchName_gte?: string | null /* baseBranchName_gte */;
  baseBranchName_contains?: string | null /* baseBranchName_contains */;
  baseBranchName_not_contains?: string | null /* baseBranchName_not_contains */;
  baseBranchName_starts_with?: string | null /* baseBranchName_starts_with */;
  baseBranchName_not_starts_with?:
    | string
    | null /* baseBranchName_not_starts_with */;
  baseBranchName_ends_with?: string | null /* baseBranchName_ends_with */;
  baseBranchName_not_ends_with?:
    | string
    | null /* baseBranchName_not_ends_with */;
  branchName?: string | null /* branchName */;
  branchName_not?: string | null /* branchName_not */;
  branchName_in?: string[] | null /* branchName_in */;
  branchName_not_in?: string[] | null /* branchName_not_in */;
  branchName_lt?: string | null /* branchName_lt */;
  branchName_lte?: string | null /* branchName_lte */;
  branchName_gt?: string | null /* branchName_gt */;
  branchName_gte?: string | null /* branchName_gte */;
  branchName_contains?: string | null /* branchName_contains */;
  branchName_not_contains?: string | null /* branchName_not_contains */;
  branchName_starts_with?: string | null /* branchName_starts_with */;
  branchName_not_starts_with?: string | null /* branchName_not_starts_with */;
  branchName_ends_with?: string | null /* branchName_ends_with */;
  branchName_not_ends_with?: string | null /* branchName_not_ends_with */;
  title?: string | null /* title */;
  title_not?: string | null /* title_not */;
  title_in?: string[] | null /* title_in */;
  title_not_in?: string[] | null /* title_not_in */;
  title_lt?: string | null /* title_lt */;
  title_lte?: string | null /* title_lte */;
  title_gt?: string | null /* title_gt */;
  title_gte?: string | null /* title_gte */;
  title_contains?: string | null /* title_contains */;
  title_not_contains?: string | null /* title_not_contains */;
  title_starts_with?: string | null /* title_starts_with */;
  title_not_starts_with?: string | null /* title_not_starts_with */;
  title_ends_with?: string | null /* title_ends_with */;
  title_not_ends_with?: string | null /* title_not_ends_with */;
  createdAt?: string | null /* createdAt */;
  createdAt_not?: string | null /* createdAt_not */;
  createdAt_in?: string[] | null /* createdAt_in */;
  createdAt_not_in?: string[] | null /* createdAt_not_in */;
  createdAt_lt?: string | null /* createdAt_lt */;
  createdAt_lte?: string | null /* createdAt_lte */;
  createdAt_gt?: string | null /* createdAt_gt */;
  createdAt_gte?: string | null /* createdAt_gte */;
  createdAt_contains?: string | null /* createdAt_contains */;
  createdAt_not_contains?: string | null /* createdAt_not_contains */;
  createdAt_starts_with?: string | null /* createdAt_starts_with */;
  createdAt_not_starts_with?: string | null /* createdAt_not_starts_with */;
  createdAt_ends_with?: string | null /* createdAt_ends_with */;
  createdAt_not_ends_with?: string | null /* createdAt_not_ends_with */;
  updatedAt?: string | null /* updatedAt */;
  updatedAt_not?: string | null /* updatedAt_not */;
  updatedAt_in?: string[] | null /* updatedAt_in */;
  updatedAt_not_in?: string[] | null /* updatedAt_not_in */;
  updatedAt_lt?: string | null /* updatedAt_lt */;
  updatedAt_lte?: string | null /* updatedAt_lte */;
  updatedAt_gt?: string | null /* updatedAt_gt */;
  updatedAt_gte?: string | null /* updatedAt_gte */;
  updatedAt_contains?: string | null /* updatedAt_contains */;
  updatedAt_not_contains?: string | null /* updatedAt_not_contains */;
  updatedAt_starts_with?: string | null /* updatedAt_starts_with */;
  updatedAt_not_starts_with?: string | null /* updatedAt_not_starts_with */;
  updatedAt_ends_with?: string | null /* updatedAt_ends_with */;
  updatedAt_not_ends_with?: string | null /* updatedAt_not_ends_with */;
  closedAt?: string | null /* closedAt */;
  closedAt_not?: string | null /* closedAt_not */;
  closedAt_in?: string[] | null /* closedAt_in */;
  closedAt_not_in?: string[] | null /* closedAt_not_in */;
  closedAt_lt?: string | null /* closedAt_lt */;
  closedAt_lte?: string | null /* closedAt_lte */;
  closedAt_gt?: string | null /* closedAt_gt */;
  closedAt_gte?: string | null /* closedAt_gte */;
  closedAt_contains?: string | null /* closedAt_contains */;
  closedAt_not_contains?: string | null /* closedAt_not_contains */;
  closedAt_starts_with?: string | null /* closedAt_starts_with */;
  closedAt_not_starts_with?: string | null /* closedAt_not_starts_with */;
  closedAt_ends_with?: string | null /* closedAt_ends_with */;
  closedAt_not_ends_with?: string | null /* closedAt_not_ends_with */;
  mergedAt?: string | null /* mergedAt */;
  mergedAt_not?: string | null /* mergedAt_not */;
  mergedAt_in?: string[] | null /* mergedAt_in */;
  mergedAt_not_in?: string[] | null /* mergedAt_not_in */;
  mergedAt_lt?: string | null /* mergedAt_lt */;
  mergedAt_lte?: string | null /* mergedAt_lte */;
  mergedAt_gt?: string | null /* mergedAt_gt */;
  mergedAt_gte?: string | null /* mergedAt_gte */;
  mergedAt_contains?: string | null /* mergedAt_contains */;
  mergedAt_not_contains?: string | null /* mergedAt_not_contains */;
  mergedAt_starts_with?: string | null /* mergedAt_starts_with */;
  mergedAt_not_starts_with?: string | null /* mergedAt_not_starts_with */;
  mergedAt_ends_with?: string | null /* mergedAt_ends_with */;
  mergedAt_not_ends_with?: string | null /* mergedAt_not_ends_with */;
  mergeStatus?: MergeStatus | null /* mergeStatus */;
  mergeStatus_not?: MergeStatus | null /* mergeStatus_not */;
  mergeStatus_in?: MergeStatus[] | null /* mergeStatus_in */;
  mergeStatus_not_in?: MergeStatus[] | null /* mergeStatus_not_in */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
  head?: _CommitFilter | null /* head */;
  head_not?: _CommitFilter | null /* head_not */;
  head_in?: _CommitFilter | null /* head_in */;
  head_not_in?: _CommitFilter | null /* head_not_in */;
  base?: _CommitFilter | null /* base */;
  base_not?: _CommitFilter | null /* base_not */;
  base_in?: _CommitFilter | null /* base_in */;
  base_not_in?: _CommitFilter | null /* base_not_in */;
  mergeCommit?: _CommitFilter | null /* mergeCommit */;
  mergeCommit_not?: _CommitFilter | null /* mergeCommit_not */;
  mergeCommit_in?: _CommitFilter | null /* mergeCommit_in */;
  mergeCommit_not_in?: _CommitFilter | null /* mergeCommit_not_in */;
  author?: _SCMIdFilter | null /* author */;
  author_not?: _SCMIdFilter | null /* author_not */;
  author_in?: _SCMIdFilter | null /* author_in */;
  author_not_in?: _SCMIdFilter | null /* author_not_in */;
  merger?: _SCMIdFilter | null /* merger */;
  merger_not?: _SCMIdFilter | null /* merger_not */;
  merger_in?: _SCMIdFilter | null /* merger_in */;
  merger_not_in?: _SCMIdFilter | null /* merger_not_in */;
  assignees?: _SCMIdFilter | null /* assignees */;
  assignees_not?: _SCMIdFilter | null /* assignees_not */;
  assignees_in?: _SCMIdFilter | null /* assignees_in */;
  assignees_not_in?: _SCMIdFilter | null /* assignees_not_in */;
  assignees_some?: _SCMIdFilter | null /* assignees_some */;
  assignees_none?: _SCMIdFilter | null /* assignees_none */;
  assignees_single?: _SCMIdFilter | null /* assignees_single */;
  assignees_every?: _SCMIdFilter | null /* assignees_every */;
  commits?: _CommitFilter | null /* commits */;
  commits_not?: _CommitFilter | null /* commits_not */;
  commits_in?: _CommitFilter | null /* commits_in */;
  commits_not_in?: _CommitFilter | null /* commits_not_in */;
  commits_some?: _CommitFilter | null /* commits_some */;
  commits_none?: _CommitFilter | null /* commits_none */;
  commits_single?: _CommitFilter | null /* commits_single */;
  commits_every?: _CommitFilter | null /* commits_every */;
  branch?: _BranchFilter | null /* branch */;
  branch_not?: _BranchFilter | null /* branch_not */;
  branch_in?: _BranchFilter | null /* branch_in */;
  branch_not_in?: _BranchFilter | null /* branch_not_in */;
  sourceBranch?: _BranchFilter | null /* sourceBranch */;
  sourceBranch_not?: _BranchFilter | null /* sourceBranch_not */;
  sourceBranch_in?: _BranchFilter | null /* sourceBranch_in */;
  sourceBranch_not_in?: _BranchFilter | null /* sourceBranch_not_in */;
  destinationBranch?: _BranchFilter | null /* destinationBranch */;
  destinationBranch_not?: _BranchFilter | null /* destinationBranch_not */;
  destinationBranch_in?: _BranchFilter | null /* destinationBranch_in */;
  destinationBranch_not_in?: _BranchFilter | null /* destinationBranch_not_in */;
  labels?: _LabelFilter | null /* labels */;
  labels_not?: _LabelFilter | null /* labels_not */;
  labels_in?: _LabelFilter | null /* labels_in */;
  labels_not_in?: _LabelFilter | null /* labels_not_in */;
  labels_some?: _LabelFilter | null /* labels_some */;
  labels_none?: _LabelFilter | null /* labels_none */;
  labels_single?: _LabelFilter | null /* labels_single */;
  labels_every?: _LabelFilter | null /* labels_every */;
  reviews?: _ReviewFilter | null /* reviews */;
  reviews_not?: _ReviewFilter | null /* reviews_not */;
  reviews_in?: _ReviewFilter | null /* reviews_in */;
  reviews_not_in?: _ReviewFilter | null /* reviews_not_in */;
  reviews_some?: _ReviewFilter | null /* reviews_some */;
  reviews_none?: _ReviewFilter | null /* reviews_none */;
  reviews_single?: _ReviewFilter | null /* reviews_single */;
  reviews_every?: _ReviewFilter | null /* reviews_every */;
  reviewers?: _SCMIdFilter | null /* reviewers */;
  reviewers_not?: _SCMIdFilter | null /* reviewers_not */;
  reviewers_in?: _SCMIdFilter | null /* reviewers_in */;
  reviewers_not_in?: _SCMIdFilter | null /* reviewers_not_in */;
  reviewers_some?: _SCMIdFilter | null /* reviewers_some */;
  reviewers_none?: _SCMIdFilter | null /* reviewers_none */;
  reviewers_single?: _SCMIdFilter | null /* reviewers_single */;
  reviewers_every?: _SCMIdFilter | null /* reviewers_every */;
  lastAssignedBy?: _SCMIdFilter | null /* lastAssignedBy */;
  lastAssignedBy_not?: _SCMIdFilter | null /* lastAssignedBy_not */;
  lastAssignedBy_in?: _SCMIdFilter | null /* lastAssignedBy_in */;
  lastAssignedBy_not_in?: _SCMIdFilter | null /* lastAssignedBy_not_in */;
  comments?: _CommentFilter | null /* comments */;
  comments_not?: _CommentFilter | null /* comments_not */;
  comments_in?: _CommentFilter | null /* comments_in */;
  comments_not_in?: _CommentFilter | null /* comments_not_in */;
  comments_some?: _CommentFilter | null /* comments_some */;
  comments_none?: _CommentFilter | null /* comments_none */;
  comments_single?: _CommentFilter | null /* comments_single */;
  comments_every?: _CommentFilter | null /* comments_every */;
  builds?: _BuildFilter | null /* builds */;
  builds_not?: _BuildFilter | null /* builds_not */;
  builds_in?: _BuildFilter | null /* builds_in */;
  builds_not_in?: _BuildFilter | null /* builds_not_in */;
  builds_some?: _BuildFilter | null /* builds_some */;
  builds_none?: _BuildFilter | null /* builds_none */;
  builds_single?: _BuildFilter | null /* builds_single */;
  builds_every?: _BuildFilter | null /* builds_every */;
}
/* Filter Input Type for Commit */
export interface _CommitFilter {
  AND?: _CommitFilter[] | null /* AND */;
  OR?: _CommitFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  sha?: string | null /* sha */;
  sha_not?: string | null /* sha_not */;
  sha_in?: string[] | null /* sha_in */;
  sha_not_in?: string[] | null /* sha_not_in */;
  sha_lt?: string | null /* sha_lt */;
  sha_lte?: string | null /* sha_lte */;
  sha_gt?: string | null /* sha_gt */;
  sha_gte?: string | null /* sha_gte */;
  sha_contains?: string | null /* sha_contains */;
  sha_not_contains?: string | null /* sha_not_contains */;
  sha_starts_with?: string | null /* sha_starts_with */;
  sha_not_starts_with?: string | null /* sha_not_starts_with */;
  sha_ends_with?: string | null /* sha_ends_with */;
  sha_not_ends_with?: string | null /* sha_not_ends_with */;
  message?: string | null /* message */;
  message_not?: string | null /* message_not */;
  message_in?: string[] | null /* message_in */;
  message_not_in?: string[] | null /* message_not_in */;
  message_lt?: string | null /* message_lt */;
  message_lte?: string | null /* message_lte */;
  message_gt?: string | null /* message_gt */;
  message_gte?: string | null /* message_gte */;
  message_contains?: string | null /* message_contains */;
  message_not_contains?: string | null /* message_not_contains */;
  message_starts_with?: string | null /* message_starts_with */;
  message_not_starts_with?: string | null /* message_not_starts_with */;
  message_ends_with?: string | null /* message_ends_with */;
  message_not_ends_with?: string | null /* message_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  email?: _EmailFilter | null /* email */;
  email_not?: _EmailFilter | null /* email_not */;
  email_in?: _EmailFilter | null /* email_in */;
  email_not_in?: _EmailFilter | null /* email_not_in */;
  builds?: _BuildFilter | null /* builds */;
  builds_not?: _BuildFilter | null /* builds_not */;
  builds_in?: _BuildFilter | null /* builds_in */;
  builds_not_in?: _BuildFilter | null /* builds_not_in */;
  builds_some?: _BuildFilter | null /* builds_some */;
  builds_none?: _BuildFilter | null /* builds_none */;
  builds_single?: _BuildFilter | null /* builds_single */;
  builds_every?: _BuildFilter | null /* builds_every */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
  author?: _SCMIdFilter | null /* author */;
  author_not?: _SCMIdFilter | null /* author_not */;
  author_in?: _SCMIdFilter | null /* author_in */;
  author_not_in?: _SCMIdFilter | null /* author_not_in */;
  committer?: _SCMIdFilter | null /* committer */;
  committer_not?: _SCMIdFilter | null /* committer_not */;
  committer_in?: _SCMIdFilter | null /* committer_in */;
  committer_not_in?: _SCMIdFilter | null /* committer_not_in */;
  tags?: _TagFilter | null /* tags */;
  tags_not?: _TagFilter | null /* tags_not */;
  tags_in?: _TagFilter | null /* tags_in */;
  tags_not_in?: _TagFilter | null /* tags_not_in */;
  tags_some?: _TagFilter | null /* tags_some */;
  tags_none?: _TagFilter | null /* tags_none */;
  tags_single?: _TagFilter | null /* tags_single */;
  tags_every?: _TagFilter | null /* tags_every */;
  resolves?: _IssueFilter | null /* resolves */;
  resolves_not?: _IssueFilter | null /* resolves_not */;
  resolves_in?: _IssueFilter | null /* resolves_in */;
  resolves_not_in?: _IssueFilter | null /* resolves_not_in */;
  resolves_some?: _IssueFilter | null /* resolves_some */;
  resolves_none?: _IssueFilter | null /* resolves_none */;
  resolves_single?: _IssueFilter | null /* resolves_single */;
  resolves_every?: _IssueFilter | null /* resolves_every */;
  statuses?: _StatusFilter | null /* statuses */;
  statuses_not?: _StatusFilter | null /* statuses_not */;
  statuses_in?: _StatusFilter | null /* statuses_in */;
  statuses_not_in?: _StatusFilter | null /* statuses_not_in */;
  statuses_some?: _StatusFilter | null /* statuses_some */;
  statuses_none?: _StatusFilter | null /* statuses_none */;
  statuses_single?: _StatusFilter | null /* statuses_single */;
  statuses_every?: _StatusFilter | null /* statuses_every */;
  pushes?: _PushFilter | null /* pushes */;
  pushes_not?: _PushFilter | null /* pushes_not */;
  pushes_in?: _PushFilter | null /* pushes_in */;
  pushes_not_in?: _PushFilter | null /* pushes_not_in */;
  pushes_some?: _PushFilter | null /* pushes_some */;
  pushes_none?: _PushFilter | null /* pushes_none */;
  pushes_single?: _PushFilter | null /* pushes_single */;
  pushes_every?: _PushFilter | null /* pushes_every */;
  pullRequests?: _PullRequestFilter | null /* pullRequests */;
  pullRequests_not?: _PullRequestFilter | null /* pullRequests_not */;
  pullRequests_in?: _PullRequestFilter | null /* pullRequests_in */;
  pullRequests_not_in?: _PullRequestFilter | null /* pullRequests_not_in */;
  pullRequests_some?: _PullRequestFilter | null /* pullRequests_some */;
  pullRequests_none?: _PullRequestFilter | null /* pullRequests_none */;
  pullRequests_single?: _PullRequestFilter | null /* pullRequests_single */;
  pullRequests_every?: _PullRequestFilter | null /* pullRequests_every */;
  herokuApps?: _HerokuAppFilter | null /* herokuApps */;
  herokuApps_not?: _HerokuAppFilter | null /* herokuApps_not */;
  herokuApps_in?: _HerokuAppFilter | null /* herokuApps_in */;
  herokuApps_not_in?: _HerokuAppFilter | null /* herokuApps_not_in */;
  herokuApps_some?: _HerokuAppFilter | null /* herokuApps_some */;
  herokuApps_none?: _HerokuAppFilter | null /* herokuApps_none */;
  herokuApps_single?: _HerokuAppFilter | null /* herokuApps_single */;
  herokuApps_every?: _HerokuAppFilter | null /* herokuApps_every */;
  apps?: _ApplicationFilter | null /* apps */;
  apps_not?: _ApplicationFilter | null /* apps_not */;
  apps_in?: _ApplicationFilter | null /* apps_in */;
  apps_not_in?: _ApplicationFilter | null /* apps_not_in */;
  apps_some?: _ApplicationFilter | null /* apps_some */;
  apps_none?: _ApplicationFilter | null /* apps_none */;
  apps_single?: _ApplicationFilter | null /* apps_single */;
  apps_every?: _ApplicationFilter | null /* apps_every */;
  fingerprints?: _FingerprintFilter | null /* fingerprints */;
  fingerprints_not?: _FingerprintFilter | null /* fingerprints_not */;
  fingerprints_in?: _FingerprintFilter | null /* fingerprints_in */;
  fingerprints_not_in?: _FingerprintFilter | null /* fingerprints_not_in */;
  fingerprints_some?: _FingerprintFilter | null /* fingerprints_some */;
  fingerprints_none?: _FingerprintFilter | null /* fingerprints_none */;
  fingerprints_single?: _FingerprintFilter | null /* fingerprints_single */;
  fingerprints_every?: _FingerprintFilter | null /* fingerprints_every */;
  impact?: _ParentImpactFilter | null /* impact */;
  impact_not?: _ParentImpactFilter | null /* impact_not */;
  impact_in?: _ParentImpactFilter | null /* impact_in */;
  impact_not_in?: _ParentImpactFilter | null /* impact_not_in */;
  image?: _DockerImageFilter | null /* image */;
  image_not?: _DockerImageFilter | null /* image_not */;
  image_in?: _DockerImageFilter | null /* image_in */;
  image_not_in?: _DockerImageFilter | null /* image_not_in */;
  images?: _DockerImageFilter | null /* images */;
  images_not?: _DockerImageFilter | null /* images_not */;
  images_in?: _DockerImageFilter | null /* images_in */;
  images_not_in?: _DockerImageFilter | null /* images_not_in */;
  images_some?: _DockerImageFilter | null /* images_some */;
  images_none?: _DockerImageFilter | null /* images_none */;
  images_single?: _DockerImageFilter | null /* images_single */;
  images_every?: _DockerImageFilter | null /* images_every */;
}
/* Filter Input Type for Build */
export interface _BuildFilter {
  AND?: _BuildFilter[] | null /* AND */;
  OR?: _BuildFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  buildId?: string | null /* buildId */;
  buildId_not?: string | null /* buildId_not */;
  buildId_in?: string[] | null /* buildId_in */;
  buildId_not_in?: string[] | null /* buildId_not_in */;
  buildId_lt?: string | null /* buildId_lt */;
  buildId_lte?: string | null /* buildId_lte */;
  buildId_gt?: string | null /* buildId_gt */;
  buildId_gte?: string | null /* buildId_gte */;
  buildId_contains?: string | null /* buildId_contains */;
  buildId_not_contains?: string | null /* buildId_not_contains */;
  buildId_starts_with?: string | null /* buildId_starts_with */;
  buildId_not_starts_with?: string | null /* buildId_not_starts_with */;
  buildId_ends_with?: string | null /* buildId_ends_with */;
  buildId_not_ends_with?: string | null /* buildId_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  status?: BuildStatus | null /* status */;
  status_not?: BuildStatus | null /* status_not */;
  status_in?: BuildStatus[] | null /* status_in */;
  status_not_in?: BuildStatus[] | null /* status_not_in */;
  buildUrl?: string | null /* buildUrl */;
  buildUrl_not?: string | null /* buildUrl_not */;
  buildUrl_in?: string[] | null /* buildUrl_in */;
  buildUrl_not_in?: string[] | null /* buildUrl_not_in */;
  buildUrl_lt?: string | null /* buildUrl_lt */;
  buildUrl_lte?: string | null /* buildUrl_lte */;
  buildUrl_gt?: string | null /* buildUrl_gt */;
  buildUrl_gte?: string | null /* buildUrl_gte */;
  buildUrl_contains?: string | null /* buildUrl_contains */;
  buildUrl_not_contains?: string | null /* buildUrl_not_contains */;
  buildUrl_starts_with?: string | null /* buildUrl_starts_with */;
  buildUrl_not_starts_with?: string | null /* buildUrl_not_starts_with */;
  buildUrl_ends_with?: string | null /* buildUrl_ends_with */;
  buildUrl_not_ends_with?: string | null /* buildUrl_not_ends_with */;
  compareUrl?: string | null /* compareUrl */;
  compareUrl_not?: string | null /* compareUrl_not */;
  compareUrl_in?: string[] | null /* compareUrl_in */;
  compareUrl_not_in?: string[] | null /* compareUrl_not_in */;
  compareUrl_lt?: string | null /* compareUrl_lt */;
  compareUrl_lte?: string | null /* compareUrl_lte */;
  compareUrl_gt?: string | null /* compareUrl_gt */;
  compareUrl_gte?: string | null /* compareUrl_gte */;
  compareUrl_contains?: string | null /* compareUrl_contains */;
  compareUrl_not_contains?: string | null /* compareUrl_not_contains */;
  compareUrl_starts_with?: string | null /* compareUrl_starts_with */;
  compareUrl_not_starts_with?: string | null /* compareUrl_not_starts_with */;
  compareUrl_ends_with?: string | null /* compareUrl_ends_with */;
  compareUrl_not_ends_with?: string | null /* compareUrl_not_ends_with */;
  trigger?: BuildTrigger | null /* trigger */;
  trigger_not?: BuildTrigger | null /* trigger_not */;
  trigger_in?: BuildTrigger[] | null /* trigger_in */;
  trigger_not_in?: BuildTrigger[] | null /* trigger_not_in */;
  provider?: string | null /* provider */;
  provider_not?: string | null /* provider_not */;
  provider_in?: string[] | null /* provider_in */;
  provider_not_in?: string[] | null /* provider_not_in */;
  provider_lt?: string | null /* provider_lt */;
  provider_lte?: string | null /* provider_lte */;
  provider_gt?: string | null /* provider_gt */;
  provider_gte?: string | null /* provider_gte */;
  provider_contains?: string | null /* provider_contains */;
  provider_not_contains?: string | null /* provider_not_contains */;
  provider_starts_with?: string | null /* provider_starts_with */;
  provider_not_starts_with?: string | null /* provider_not_starts_with */;
  provider_ends_with?: string | null /* provider_ends_with */;
  provider_not_ends_with?: string | null /* provider_not_ends_with */;
  pullRequestNumber?: number | null /* pullRequestNumber */;
  pullRequestNumber_not?: number | null /* pullRequestNumber_not */;
  pullRequestNumber_in?: number[] | null /* pullRequestNumber_in */;
  pullRequestNumber_not_in?: number[] | null /* pullRequestNumber_not_in */;
  pullRequestNumber_lt?: number | null /* pullRequestNumber_lt */;
  pullRequestNumber_lte?: number | null /* pullRequestNumber_lte */;
  pullRequestNumber_gt?: number | null /* pullRequestNumber_gt */;
  pullRequestNumber_gte?: number | null /* pullRequestNumber_gte */;
  startedAt?: string | null /* startedAt */;
  startedAt_not?: string | null /* startedAt_not */;
  startedAt_in?: string[] | null /* startedAt_in */;
  startedAt_not_in?: string[] | null /* startedAt_not_in */;
  startedAt_lt?: string | null /* startedAt_lt */;
  startedAt_lte?: string | null /* startedAt_lte */;
  startedAt_gt?: string | null /* startedAt_gt */;
  startedAt_gte?: string | null /* startedAt_gte */;
  startedAt_contains?: string | null /* startedAt_contains */;
  startedAt_not_contains?: string | null /* startedAt_not_contains */;
  startedAt_starts_with?: string | null /* startedAt_starts_with */;
  startedAt_not_starts_with?: string | null /* startedAt_not_starts_with */;
  startedAt_ends_with?: string | null /* startedAt_ends_with */;
  startedAt_not_ends_with?: string | null /* startedAt_not_ends_with */;
  finishedAt?: string | null /* finishedAt */;
  finishedAt_not?: string | null /* finishedAt_not */;
  finishedAt_in?: string[] | null /* finishedAt_in */;
  finishedAt_not_in?: string[] | null /* finishedAt_not_in */;
  finishedAt_lt?: string | null /* finishedAt_lt */;
  finishedAt_lte?: string | null /* finishedAt_lte */;
  finishedAt_gt?: string | null /* finishedAt_gt */;
  finishedAt_gte?: string | null /* finishedAt_gte */;
  finishedAt_contains?: string | null /* finishedAt_contains */;
  finishedAt_not_contains?: string | null /* finishedAt_not_contains */;
  finishedAt_starts_with?: string | null /* finishedAt_starts_with */;
  finishedAt_not_starts_with?: string | null /* finishedAt_not_starts_with */;
  finishedAt_ends_with?: string | null /* finishedAt_ends_with */;
  finishedAt_not_ends_with?: string | null /* finishedAt_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  workflowId?: string | null /* workflowId */;
  workflowId_not?: string | null /* workflowId_not */;
  workflowId_in?: string[] | null /* workflowId_in */;
  workflowId_not_in?: string[] | null /* workflowId_not_in */;
  workflowId_lt?: string | null /* workflowId_lt */;
  workflowId_lte?: string | null /* workflowId_lte */;
  workflowId_gt?: string | null /* workflowId_gt */;
  workflowId_gte?: string | null /* workflowId_gte */;
  workflowId_contains?: string | null /* workflowId_contains */;
  workflowId_not_contains?: string | null /* workflowId_not_contains */;
  workflowId_starts_with?: string | null /* workflowId_starts_with */;
  workflowId_not_starts_with?: string | null /* workflowId_not_starts_with */;
  workflowId_ends_with?: string | null /* workflowId_ends_with */;
  workflowId_not_ends_with?: string | null /* workflowId_not_ends_with */;
  jobName?: string | null /* jobName */;
  jobName_not?: string | null /* jobName_not */;
  jobName_in?: string[] | null /* jobName_in */;
  jobName_not_in?: string[] | null /* jobName_not_in */;
  jobName_lt?: string | null /* jobName_lt */;
  jobName_lte?: string | null /* jobName_lte */;
  jobName_gt?: string | null /* jobName_gt */;
  jobName_gte?: string | null /* jobName_gte */;
  jobName_contains?: string | null /* jobName_contains */;
  jobName_not_contains?: string | null /* jobName_not_contains */;
  jobName_starts_with?: string | null /* jobName_starts_with */;
  jobName_not_starts_with?: string | null /* jobName_not_starts_with */;
  jobName_ends_with?: string | null /* jobName_ends_with */;
  jobName_not_ends_with?: string | null /* jobName_not_ends_with */;
  jobId?: string | null /* jobId */;
  jobId_not?: string | null /* jobId_not */;
  jobId_in?: string[] | null /* jobId_in */;
  jobId_not_in?: string[] | null /* jobId_not_in */;
  jobId_lt?: string | null /* jobId_lt */;
  jobId_lte?: string | null /* jobId_lte */;
  jobId_gt?: string | null /* jobId_gt */;
  jobId_gte?: string | null /* jobId_gte */;
  jobId_contains?: string | null /* jobId_contains */;
  jobId_not_contains?: string | null /* jobId_not_contains */;
  jobId_starts_with?: string | null /* jobId_starts_with */;
  jobId_not_starts_with?: string | null /* jobId_not_starts_with */;
  jobId_ends_with?: string | null /* jobId_ends_with */;
  jobId_not_ends_with?: string | null /* jobId_not_ends_with */;
  data?: string | null /* data */;
  data_not?: string | null /* data_not */;
  data_in?: string[] | null /* data_in */;
  data_not_in?: string[] | null /* data_not_in */;
  data_lt?: string | null /* data_lt */;
  data_lte?: string | null /* data_lte */;
  data_gt?: string | null /* data_gt */;
  data_gte?: string | null /* data_gte */;
  data_contains?: string | null /* data_contains */;
  data_not_contains?: string | null /* data_not_contains */;
  data_starts_with?: string | null /* data_starts_with */;
  data_not_starts_with?: string | null /* data_not_starts_with */;
  data_ends_with?: string | null /* data_ends_with */;
  data_not_ends_with?: string | null /* data_not_ends_with */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
  push?: _PushFilter | null /* push */;
  push_not?: _PushFilter | null /* push_not */;
  push_in?: _PushFilter | null /* push_in */;
  push_not_in?: _PushFilter | null /* push_not_in */;
  pullRequest?: _PullRequestFilter | null /* pullRequest */;
  pullRequest_not?: _PullRequestFilter | null /* pullRequest_not */;
  pullRequest_in?: _PullRequestFilter | null /* pullRequest_in */;
  pullRequest_not_in?: _PullRequestFilter | null /* pullRequest_not_in */;
  tag?: _TagFilter | null /* tag */;
  tag_not?: _TagFilter | null /* tag_not */;
  tag_in?: _TagFilter | null /* tag_in */;
  tag_not_in?: _TagFilter | null /* tag_not_in */;
  commit?: _CommitFilter | null /* commit */;
  commit_not?: _CommitFilter | null /* commit_not */;
  commit_in?: _CommitFilter | null /* commit_in */;
  commit_not_in?: _CommitFilter | null /* commit_not_in */;
  workflow?: _WorkflowFilter | null /* workflow */;
  workflow_not?: _WorkflowFilter | null /* workflow_not */;
  workflow_in?: _WorkflowFilter | null /* workflow_in */;
  workflow_not_in?: _WorkflowFilter | null /* workflow_not_in */;
}
/* Filter Input Type for Push */
export interface _PushFilter {
  AND?: _PushFilter[] | null /* AND */;
  OR?: _PushFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  branch?: string | null /* branch */;
  branch_not?: string | null /* branch_not */;
  branch_in?: string[] | null /* branch_in */;
  branch_not_in?: string[] | null /* branch_not_in */;
  branch_lt?: string | null /* branch_lt */;
  branch_lte?: string | null /* branch_lte */;
  branch_gt?: string | null /* branch_gt */;
  branch_gte?: string | null /* branch_gte */;
  branch_contains?: string | null /* branch_contains */;
  branch_not_contains?: string | null /* branch_not_contains */;
  branch_starts_with?: string | null /* branch_starts_with */;
  branch_not_starts_with?: string | null /* branch_not_starts_with */;
  branch_ends_with?: string | null /* branch_ends_with */;
  branch_not_ends_with?: string | null /* branch_not_ends_with */;
  after?: _CommitFilter | null /* after */;
  after_not?: _CommitFilter | null /* after_not */;
  after_in?: _CommitFilter | null /* after_in */;
  after_not_in?: _CommitFilter | null /* after_not_in */;
  before?: _CommitFilter | null /* before */;
  before_not?: _CommitFilter | null /* before_not */;
  before_in?: _CommitFilter | null /* before_in */;
  before_not_in?: _CommitFilter | null /* before_not_in */;
  commits?: _CommitFilter | null /* commits */;
  commits_not?: _CommitFilter | null /* commits_not */;
  commits_in?: _CommitFilter | null /* commits_in */;
  commits_not_in?: _CommitFilter | null /* commits_not_in */;
  commits_some?: _CommitFilter | null /* commits_some */;
  commits_none?: _CommitFilter | null /* commits_none */;
  commits_single?: _CommitFilter | null /* commits_single */;
  commits_every?: _CommitFilter | null /* commits_every */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
  builds?: _BuildFilter | null /* builds */;
  builds_not?: _BuildFilter | null /* builds_not */;
  builds_in?: _BuildFilter | null /* builds_in */;
  builds_not_in?: _BuildFilter | null /* builds_not_in */;
  builds_some?: _BuildFilter | null /* builds_some */;
  builds_none?: _BuildFilter | null /* builds_none */;
  builds_single?: _BuildFilter | null /* builds_single */;
  builds_every?: _BuildFilter | null /* builds_every */;
}
/* Filter Input Type for Tag */
export interface _TagFilter {
  AND?: _TagFilter[] | null /* AND */;
  OR?: _TagFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  description?: string | null /* description */;
  description_not?: string | null /* description_not */;
  description_in?: string[] | null /* description_in */;
  description_not_in?: string[] | null /* description_not_in */;
  description_lt?: string | null /* description_lt */;
  description_lte?: string | null /* description_lte */;
  description_gt?: string | null /* description_gt */;
  description_gte?: string | null /* description_gte */;
  description_contains?: string | null /* description_contains */;
  description_not_contains?: string | null /* description_not_contains */;
  description_starts_with?: string | null /* description_starts_with */;
  description_not_starts_with?: string | null /* description_not_starts_with */;
  description_ends_with?: string | null /* description_ends_with */;
  description_not_ends_with?: string | null /* description_not_ends_with */;
  ref?: string | null /* ref */;
  ref_not?: string | null /* ref_not */;
  ref_in?: string[] | null /* ref_in */;
  ref_not_in?: string[] | null /* ref_not_in */;
  ref_lt?: string | null /* ref_lt */;
  ref_lte?: string | null /* ref_lte */;
  ref_gt?: string | null /* ref_gt */;
  ref_gte?: string | null /* ref_gte */;
  ref_contains?: string | null /* ref_contains */;
  ref_not_contains?: string | null /* ref_not_contains */;
  ref_starts_with?: string | null /* ref_starts_with */;
  ref_not_starts_with?: string | null /* ref_not_starts_with */;
  ref_ends_with?: string | null /* ref_ends_with */;
  ref_not_ends_with?: string | null /* ref_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  release?: _ReleaseFilter | null /* release */;
  release_not?: _ReleaseFilter | null /* release_not */;
  release_in?: _ReleaseFilter | null /* release_in */;
  release_not_in?: _ReleaseFilter | null /* release_not_in */;
  commit?: _CommitFilter | null /* commit */;
  commit_not?: _CommitFilter | null /* commit_not */;
  commit_in?: _CommitFilter | null /* commit_in */;
  commit_not_in?: _CommitFilter | null /* commit_not_in */;
  containers?: _DockerImageFilter | null /* containers */;
  containers_not?: _DockerImageFilter | null /* containers_not */;
  containers_in?: _DockerImageFilter | null /* containers_in */;
  containers_not_in?: _DockerImageFilter | null /* containers_not_in */;
  containers_some?: _DockerImageFilter | null /* containers_some */;
  containers_none?: _DockerImageFilter | null /* containers_none */;
  containers_single?: _DockerImageFilter | null /* containers_single */;
  containers_every?: _DockerImageFilter | null /* containers_every */;
  builds?: _BuildFilter | null /* builds */;
  builds_not?: _BuildFilter | null /* builds_not */;
  builds_in?: _BuildFilter | null /* builds_in */;
  builds_not_in?: _BuildFilter | null /* builds_not_in */;
  builds_some?: _BuildFilter | null /* builds_some */;
  builds_none?: _BuildFilter | null /* builds_none */;
  builds_single?: _BuildFilter | null /* builds_single */;
  builds_every?: _BuildFilter | null /* builds_every */;
}
/* Filter Input Type for Release */
export interface _ReleaseFilter {
  AND?: _ReleaseFilter[] | null /* AND */;
  OR?: _ReleaseFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  tag?: _TagFilter | null /* tag */;
  tag_not?: _TagFilter | null /* tag_not */;
  tag_in?: _TagFilter | null /* tag_in */;
  tag_not_in?: _TagFilter | null /* tag_not_in */;
}
/* Filter Input Type for DockerImage */
export interface _DockerImageFilter {
  AND?: _DockerImageFilter[] | null /* AND */;
  OR?: _DockerImageFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  image?: string | null /* image */;
  image_not?: string | null /* image_not */;
  image_in?: string[] | null /* image_in */;
  image_not_in?: string[] | null /* image_not_in */;
  image_lt?: string | null /* image_lt */;
  image_lte?: string | null /* image_lte */;
  image_gt?: string | null /* image_gt */;
  image_gte?: string | null /* image_gte */;
  image_contains?: string | null /* image_contains */;
  image_not_contains?: string | null /* image_not_contains */;
  image_starts_with?: string | null /* image_starts_with */;
  image_not_starts_with?: string | null /* image_not_starts_with */;
  image_ends_with?: string | null /* image_ends_with */;
  image_not_ends_with?: string | null /* image_not_ends_with */;
  imageName?: string | null /* imageName */;
  imageName_not?: string | null /* imageName_not */;
  imageName_in?: string[] | null /* imageName_in */;
  imageName_not_in?: string[] | null /* imageName_not_in */;
  imageName_lt?: string | null /* imageName_lt */;
  imageName_lte?: string | null /* imageName_lte */;
  imageName_gt?: string | null /* imageName_gt */;
  imageName_gte?: string | null /* imageName_gte */;
  imageName_contains?: string | null /* imageName_contains */;
  imageName_not_contains?: string | null /* imageName_not_contains */;
  imageName_starts_with?: string | null /* imageName_starts_with */;
  imageName_not_starts_with?: string | null /* imageName_not_starts_with */;
  imageName_ends_with?: string | null /* imageName_ends_with */;
  imageName_not_ends_with?: string | null /* imageName_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  pods?: _K8PodFilter | null /* pods */;
  pods_not?: _K8PodFilter | null /* pods_not */;
  pods_in?: _K8PodFilter | null /* pods_in */;
  pods_not_in?: _K8PodFilter | null /* pods_not_in */;
  pods_some?: _K8PodFilter | null /* pods_some */;
  pods_none?: _K8PodFilter | null /* pods_none */;
  pods_single?: _K8PodFilter | null /* pods_single */;
  pods_every?: _K8PodFilter | null /* pods_every */;
  commits?: _CommitFilter | null /* commits */;
  commits_not?: _CommitFilter | null /* commits_not */;
  commits_in?: _CommitFilter | null /* commits_in */;
  commits_not_in?: _CommitFilter | null /* commits_not_in */;
  commits_some?: _CommitFilter | null /* commits_some */;
  commits_none?: _CommitFilter | null /* commits_none */;
  commits_single?: _CommitFilter | null /* commits_single */;
  commits_every?: _CommitFilter | null /* commits_every */;
  containers?: _K8ContainerFilter | null /* containers */;
  containers_not?: _K8ContainerFilter | null /* containers_not */;
  containers_in?: _K8ContainerFilter | null /* containers_in */;
  containers_not_in?: _K8ContainerFilter | null /* containers_not_in */;
  containers_some?: _K8ContainerFilter | null /* containers_some */;
  containers_none?: _K8ContainerFilter | null /* containers_none */;
  containers_single?: _K8ContainerFilter | null /* containers_single */;
  containers_every?: _K8ContainerFilter | null /* containers_every */;
}
/* Filter Input Type for K8Pod */
export interface _K8PodFilter {
  AND?: _K8PodFilter[] | null /* AND */;
  OR?: _K8PodFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  phase?: string | null /* phase */;
  phase_not?: string | null /* phase_not */;
  phase_in?: string[] | null /* phase_in */;
  phase_not_in?: string[] | null /* phase_not_in */;
  phase_lt?: string | null /* phase_lt */;
  phase_lte?: string | null /* phase_lte */;
  phase_gt?: string | null /* phase_gt */;
  phase_gte?: string | null /* phase_gte */;
  phase_contains?: string | null /* phase_contains */;
  phase_not_contains?: string | null /* phase_not_contains */;
  phase_starts_with?: string | null /* phase_starts_with */;
  phase_not_starts_with?: string | null /* phase_not_starts_with */;
  phase_ends_with?: string | null /* phase_ends_with */;
  phase_not_ends_with?: string | null /* phase_not_ends_with */;
  environment?: string | null /* environment */;
  environment_not?: string | null /* environment_not */;
  environment_in?: string[] | null /* environment_in */;
  environment_not_in?: string[] | null /* environment_not_in */;
  environment_lt?: string | null /* environment_lt */;
  environment_lte?: string | null /* environment_lte */;
  environment_gt?: string | null /* environment_gt */;
  environment_gte?: string | null /* environment_gte */;
  environment_contains?: string | null /* environment_contains */;
  environment_not_contains?: string | null /* environment_not_contains */;
  environment_starts_with?: string | null /* environment_starts_with */;
  environment_not_starts_with?: string | null /* environment_not_starts_with */;
  environment_ends_with?: string | null /* environment_ends_with */;
  environment_not_ends_with?: string | null /* environment_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  baseName?: string | null /* baseName */;
  baseName_not?: string | null /* baseName_not */;
  baseName_in?: string[] | null /* baseName_in */;
  baseName_not_in?: string[] | null /* baseName_not_in */;
  baseName_lt?: string | null /* baseName_lt */;
  baseName_lte?: string | null /* baseName_lte */;
  baseName_gt?: string | null /* baseName_gt */;
  baseName_gte?: string | null /* baseName_gte */;
  baseName_contains?: string | null /* baseName_contains */;
  baseName_not_contains?: string | null /* baseName_not_contains */;
  baseName_starts_with?: string | null /* baseName_starts_with */;
  baseName_not_starts_with?: string | null /* baseName_not_starts_with */;
  baseName_ends_with?: string | null /* baseName_ends_with */;
  baseName_not_ends_with?: string | null /* baseName_not_ends_with */;
  namespace?: string | null /* namespace */;
  namespace_not?: string | null /* namespace_not */;
  namespace_in?: string[] | null /* namespace_in */;
  namespace_not_in?: string[] | null /* namespace_not_in */;
  namespace_lt?: string | null /* namespace_lt */;
  namespace_lte?: string | null /* namespace_lte */;
  namespace_gt?: string | null /* namespace_gt */;
  namespace_gte?: string | null /* namespace_gte */;
  namespace_contains?: string | null /* namespace_contains */;
  namespace_not_contains?: string | null /* namespace_not_contains */;
  namespace_starts_with?: string | null /* namespace_starts_with */;
  namespace_not_starts_with?: string | null /* namespace_not_starts_with */;
  namespace_ends_with?: string | null /* namespace_ends_with */;
  namespace_not_ends_with?: string | null /* namespace_not_ends_with */;
  statusJSON?: string | null /* statusJSON */;
  statusJSON_not?: string | null /* statusJSON_not */;
  statusJSON_in?: string[] | null /* statusJSON_in */;
  statusJSON_not_in?: string[] | null /* statusJSON_not_in */;
  statusJSON_lt?: string | null /* statusJSON_lt */;
  statusJSON_lte?: string | null /* statusJSON_lte */;
  statusJSON_gt?: string | null /* statusJSON_gt */;
  statusJSON_gte?: string | null /* statusJSON_gte */;
  statusJSON_contains?: string | null /* statusJSON_contains */;
  statusJSON_not_contains?: string | null /* statusJSON_not_contains */;
  statusJSON_starts_with?: string | null /* statusJSON_starts_with */;
  statusJSON_not_starts_with?: string | null /* statusJSON_not_starts_with */;
  statusJSON_ends_with?: string | null /* statusJSON_ends_with */;
  statusJSON_not_ends_with?: string | null /* statusJSON_not_ends_with */;
  host?: string | null /* host */;
  host_not?: string | null /* host_not */;
  host_in?: string[] | null /* host_in */;
  host_not_in?: string[] | null /* host_not_in */;
  host_lt?: string | null /* host_lt */;
  host_lte?: string | null /* host_lte */;
  host_gt?: string | null /* host_gt */;
  host_gte?: string | null /* host_gte */;
  host_contains?: string | null /* host_contains */;
  host_not_contains?: string | null /* host_not_contains */;
  host_starts_with?: string | null /* host_starts_with */;
  host_not_starts_with?: string | null /* host_not_starts_with */;
  host_ends_with?: string | null /* host_ends_with */;
  host_not_ends_with?: string | null /* host_not_ends_with */;
  state?: string | null /* state */;
  state_not?: string | null /* state_not */;
  state_in?: string[] | null /* state_in */;
  state_not_in?: string[] | null /* state_not_in */;
  state_lt?: string | null /* state_lt */;
  state_lte?: string | null /* state_lte */;
  state_gt?: string | null /* state_gt */;
  state_gte?: string | null /* state_gte */;
  state_contains?: string | null /* state_contains */;
  state_not_contains?: string | null /* state_not_contains */;
  state_starts_with?: string | null /* state_starts_with */;
  state_not_starts_with?: string | null /* state_not_starts_with */;
  state_ends_with?: string | null /* state_ends_with */;
  state_not_ends_with?: string | null /* state_not_ends_with */;
  specsJSON?: string | null /* specsJSON */;
  specsJSON_not?: string | null /* specsJSON_not */;
  specsJSON_in?: string[] | null /* specsJSON_in */;
  specsJSON_not_in?: string[] | null /* specsJSON_not_in */;
  specsJSON_lt?: string | null /* specsJSON_lt */;
  specsJSON_lte?: string | null /* specsJSON_lte */;
  specsJSON_gt?: string | null /* specsJSON_gt */;
  specsJSON_gte?: string | null /* specsJSON_gte */;
  specsJSON_contains?: string | null /* specsJSON_contains */;
  specsJSON_not_contains?: string | null /* specsJSON_not_contains */;
  specsJSON_starts_with?: string | null /* specsJSON_starts_with */;
  specsJSON_not_starts_with?: string | null /* specsJSON_not_starts_with */;
  specsJSON_ends_with?: string | null /* specsJSON_ends_with */;
  specsJSON_not_ends_with?: string | null /* specsJSON_not_ends_with */;
  envJSON?: string | null /* envJSON */;
  envJSON_not?: string | null /* envJSON_not */;
  envJSON_in?: string[] | null /* envJSON_in */;
  envJSON_not_in?: string[] | null /* envJSON_not_in */;
  envJSON_lt?: string | null /* envJSON_lt */;
  envJSON_lte?: string | null /* envJSON_lte */;
  envJSON_gt?: string | null /* envJSON_gt */;
  envJSON_gte?: string | null /* envJSON_gte */;
  envJSON_contains?: string | null /* envJSON_contains */;
  envJSON_not_contains?: string | null /* envJSON_not_contains */;
  envJSON_starts_with?: string | null /* envJSON_starts_with */;
  envJSON_not_starts_with?: string | null /* envJSON_not_starts_with */;
  envJSON_ends_with?: string | null /* envJSON_ends_with */;
  envJSON_not_ends_with?: string | null /* envJSON_not_ends_with */;
  metadataJSON?: string | null /* metadataJSON */;
  metadataJSON_not?: string | null /* metadataJSON_not */;
  metadataJSON_in?: string[] | null /* metadataJSON_in */;
  metadataJSON_not_in?: string[] | null /* metadataJSON_not_in */;
  metadataJSON_lt?: string | null /* metadataJSON_lt */;
  metadataJSON_lte?: string | null /* metadataJSON_lte */;
  metadataJSON_gt?: string | null /* metadataJSON_gt */;
  metadataJSON_gte?: string | null /* metadataJSON_gte */;
  metadataJSON_contains?: string | null /* metadataJSON_contains */;
  metadataJSON_not_contains?: string | null /* metadataJSON_not_contains */;
  metadataJSON_starts_with?: string | null /* metadataJSON_starts_with */;
  metadataJSON_not_starts_with?:
    | string
    | null /* metadataJSON_not_starts_with */;
  metadataJSON_ends_with?: string | null /* metadataJSON_ends_with */;
  metadataJSON_not_ends_with?: string | null /* metadataJSON_not_ends_with */;
  containersCrashLoopBackOff?: boolean | null /* containersCrashLoopBackOff */;
  containersCrashLoopBackOff_not?:
    | boolean
    | null /* containersCrashLoopBackOff_not */;
  resourceVersion?: number | null /* resourceVersion */;
  resourceVersion_not?: number | null /* resourceVersion_not */;
  resourceVersion_in?: number[] | null /* resourceVersion_in */;
  resourceVersion_not_in?: number[] | null /* resourceVersion_not_in */;
  resourceVersion_lt?: number | null /* resourceVersion_lt */;
  resourceVersion_lte?: number | null /* resourceVersion_lte */;
  resourceVersion_gt?: number | null /* resourceVersion_gt */;
  resourceVersion_gte?: number | null /* resourceVersion_gte */;
  images?: _DockerImageFilter | null /* images */;
  images_not?: _DockerImageFilter | null /* images_not */;
  images_in?: _DockerImageFilter | null /* images_in */;
  images_not_in?: _DockerImageFilter | null /* images_not_in */;
  images_some?: _DockerImageFilter | null /* images_some */;
  images_none?: _DockerImageFilter | null /* images_none */;
  images_single?: _DockerImageFilter | null /* images_single */;
  images_every?: _DockerImageFilter | null /* images_every */;
  containers?: _K8ContainerFilter | null /* containers */;
  containers_not?: _K8ContainerFilter | null /* containers_not */;
  containers_in?: _K8ContainerFilter | null /* containers_in */;
  containers_not_in?: _K8ContainerFilter | null /* containers_not_in */;
  containers_some?: _K8ContainerFilter | null /* containers_some */;
  containers_none?: _K8ContainerFilter | null /* containers_none */;
  containers_single?: _K8ContainerFilter | null /* containers_single */;
  containers_every?: _K8ContainerFilter | null /* containers_every */;
}
/* Filter Input Type for K8Container */
export interface _K8ContainerFilter {
  AND?: _K8ContainerFilter[] | null /* AND */;
  OR?: _K8ContainerFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  imageName?: string | null /* imageName */;
  imageName_not?: string | null /* imageName_not */;
  imageName_in?: string[] | null /* imageName_in */;
  imageName_not_in?: string[] | null /* imageName_not_in */;
  imageName_lt?: string | null /* imageName_lt */;
  imageName_lte?: string | null /* imageName_lte */;
  imageName_gt?: string | null /* imageName_gt */;
  imageName_gte?: string | null /* imageName_gte */;
  imageName_contains?: string | null /* imageName_contains */;
  imageName_not_contains?: string | null /* imageName_not_contains */;
  imageName_starts_with?: string | null /* imageName_starts_with */;
  imageName_not_starts_with?: string | null /* imageName_not_starts_with */;
  imageName_ends_with?: string | null /* imageName_ends_with */;
  imageName_not_ends_with?: string | null /* imageName_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  environment?: string | null /* environment */;
  environment_not?: string | null /* environment_not */;
  environment_in?: string[] | null /* environment_in */;
  environment_not_in?: string[] | null /* environment_not_in */;
  environment_lt?: string | null /* environment_lt */;
  environment_lte?: string | null /* environment_lte */;
  environment_gt?: string | null /* environment_gt */;
  environment_gte?: string | null /* environment_gte */;
  environment_contains?: string | null /* environment_contains */;
  environment_not_contains?: string | null /* environment_not_contains */;
  environment_starts_with?: string | null /* environment_starts_with */;
  environment_not_starts_with?: string | null /* environment_not_starts_with */;
  environment_ends_with?: string | null /* environment_ends_with */;
  environment_not_ends_with?: string | null /* environment_not_ends_with */;
  containerJSON?: string | null /* containerJSON */;
  containerJSON_not?: string | null /* containerJSON_not */;
  containerJSON_in?: string[] | null /* containerJSON_in */;
  containerJSON_not_in?: string[] | null /* containerJSON_not_in */;
  containerJSON_lt?: string | null /* containerJSON_lt */;
  containerJSON_lte?: string | null /* containerJSON_lte */;
  containerJSON_gt?: string | null /* containerJSON_gt */;
  containerJSON_gte?: string | null /* containerJSON_gte */;
  containerJSON_contains?: string | null /* containerJSON_contains */;
  containerJSON_not_contains?: string | null /* containerJSON_not_contains */;
  containerJSON_starts_with?: string | null /* containerJSON_starts_with */;
  containerJSON_not_starts_with?:
    | string
    | null /* containerJSON_not_starts_with */;
  containerJSON_ends_with?: string | null /* containerJSON_ends_with */;
  containerJSON_not_ends_with?: string | null /* containerJSON_not_ends_with */;
  state?: string | null /* state */;
  state_not?: string | null /* state_not */;
  state_in?: string[] | null /* state_in */;
  state_not_in?: string[] | null /* state_not_in */;
  state_lt?: string | null /* state_lt */;
  state_lte?: string | null /* state_lte */;
  state_gt?: string | null /* state_gt */;
  state_gte?: string | null /* state_gte */;
  state_contains?: string | null /* state_contains */;
  state_not_contains?: string | null /* state_not_contains */;
  state_starts_with?: string | null /* state_starts_with */;
  state_not_starts_with?: string | null /* state_not_starts_with */;
  state_ends_with?: string | null /* state_ends_with */;
  state_not_ends_with?: string | null /* state_not_ends_with */;
  stateReason?: string | null /* stateReason */;
  stateReason_not?: string | null /* stateReason_not */;
  stateReason_in?: string[] | null /* stateReason_in */;
  stateReason_not_in?: string[] | null /* stateReason_not_in */;
  stateReason_lt?: string | null /* stateReason_lt */;
  stateReason_lte?: string | null /* stateReason_lte */;
  stateReason_gt?: string | null /* stateReason_gt */;
  stateReason_gte?: string | null /* stateReason_gte */;
  stateReason_contains?: string | null /* stateReason_contains */;
  stateReason_not_contains?: string | null /* stateReason_not_contains */;
  stateReason_starts_with?: string | null /* stateReason_starts_with */;
  stateReason_not_starts_with?: string | null /* stateReason_not_starts_with */;
  stateReason_ends_with?: string | null /* stateReason_ends_with */;
  stateReason_not_ends_with?: string | null /* stateReason_not_ends_with */;
  ready?: boolean | null /* ready */;
  ready_not?: boolean | null /* ready_not */;
  restartCount?: number | null /* restartCount */;
  restartCount_not?: number | null /* restartCount_not */;
  restartCount_in?: number[] | null /* restartCount_in */;
  restartCount_not_in?: number[] | null /* restartCount_not_in */;
  restartCount_lt?: number | null /* restartCount_lt */;
  restartCount_lte?: number | null /* restartCount_lte */;
  restartCount_gt?: number | null /* restartCount_gt */;
  restartCount_gte?: number | null /* restartCount_gte */;
  statusJSON?: string | null /* statusJSON */;
  statusJSON_not?: string | null /* statusJSON_not */;
  statusJSON_in?: string[] | null /* statusJSON_in */;
  statusJSON_not_in?: string[] | null /* statusJSON_not_in */;
  statusJSON_lt?: string | null /* statusJSON_lt */;
  statusJSON_lte?: string | null /* statusJSON_lte */;
  statusJSON_gt?: string | null /* statusJSON_gt */;
  statusJSON_gte?: string | null /* statusJSON_gte */;
  statusJSON_contains?: string | null /* statusJSON_contains */;
  statusJSON_not_contains?: string | null /* statusJSON_not_contains */;
  statusJSON_starts_with?: string | null /* statusJSON_starts_with */;
  statusJSON_not_starts_with?: string | null /* statusJSON_not_starts_with */;
  statusJSON_ends_with?: string | null /* statusJSON_ends_with */;
  statusJSON_not_ends_with?: string | null /* statusJSON_not_ends_with */;
  resourceVersion?: number | null /* resourceVersion */;
  resourceVersion_not?: number | null /* resourceVersion_not */;
  resourceVersion_in?: number[] | null /* resourceVersion_in */;
  resourceVersion_not_in?: number[] | null /* resourceVersion_not_in */;
  resourceVersion_lt?: number | null /* resourceVersion_lt */;
  resourceVersion_lte?: number | null /* resourceVersion_lte */;
  resourceVersion_gt?: number | null /* resourceVersion_gt */;
  resourceVersion_gte?: number | null /* resourceVersion_gte */;
  containerID?: string | null /* containerID */;
  containerID_not?: string | null /* containerID_not */;
  containerID_in?: string[] | null /* containerID_in */;
  containerID_not_in?: string[] | null /* containerID_not_in */;
  containerID_lt?: string | null /* containerID_lt */;
  containerID_lte?: string | null /* containerID_lte */;
  containerID_gt?: string | null /* containerID_gt */;
  containerID_gte?: string | null /* containerID_gte */;
  containerID_contains?: string | null /* containerID_contains */;
  containerID_not_contains?: string | null /* containerID_not_contains */;
  containerID_starts_with?: string | null /* containerID_starts_with */;
  containerID_not_starts_with?: string | null /* containerID_not_starts_with */;
  containerID_ends_with?: string | null /* containerID_ends_with */;
  containerID_not_ends_with?: string | null /* containerID_not_ends_with */;
  image?: _DockerImageFilter | null /* image */;
  image_not?: _DockerImageFilter | null /* image_not */;
  image_in?: _DockerImageFilter | null /* image_in */;
  image_not_in?: _DockerImageFilter | null /* image_not_in */;
  pod?: _K8PodFilter | null /* pod */;
  pod_not?: _K8PodFilter | null /* pod_not */;
  pod_in?: _K8PodFilter | null /* pod_in */;
  pod_not_in?: _K8PodFilter | null /* pod_not_in */;
}
/* Filter Input Type for Workflow */
export interface _WorkflowFilter {
  AND?: _WorkflowFilter[] | null /* AND */;
  OR?: _WorkflowFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  workflowId?: string | null /* workflowId */;
  workflowId_not?: string | null /* workflowId_not */;
  workflowId_in?: string[] | null /* workflowId_in */;
  workflowId_not_in?: string[] | null /* workflowId_not_in */;
  workflowId_lt?: string | null /* workflowId_lt */;
  workflowId_lte?: string | null /* workflowId_lte */;
  workflowId_gt?: string | null /* workflowId_gt */;
  workflowId_gte?: string | null /* workflowId_gte */;
  workflowId_contains?: string | null /* workflowId_contains */;
  workflowId_not_contains?: string | null /* workflowId_not_contains */;
  workflowId_starts_with?: string | null /* workflowId_starts_with */;
  workflowId_not_starts_with?: string | null /* workflowId_not_starts_with */;
  workflowId_ends_with?: string | null /* workflowId_ends_with */;
  workflowId_not_ends_with?: string | null /* workflowId_not_ends_with */;
  provider?: string | null /* provider */;
  provider_not?: string | null /* provider_not */;
  provider_in?: string[] | null /* provider_in */;
  provider_not_in?: string[] | null /* provider_not_in */;
  provider_lt?: string | null /* provider_lt */;
  provider_lte?: string | null /* provider_lte */;
  provider_gt?: string | null /* provider_gt */;
  provider_gte?: string | null /* provider_gte */;
  provider_contains?: string | null /* provider_contains */;
  provider_not_contains?: string | null /* provider_not_contains */;
  provider_starts_with?: string | null /* provider_starts_with */;
  provider_not_starts_with?: string | null /* provider_not_starts_with */;
  provider_ends_with?: string | null /* provider_ends_with */;
  provider_not_ends_with?: string | null /* provider_not_ends_with */;
  config?: string | null /* config */;
  config_not?: string | null /* config_not */;
  config_in?: string[] | null /* config_in */;
  config_not_in?: string[] | null /* config_not_in */;
  config_lt?: string | null /* config_lt */;
  config_lte?: string | null /* config_lte */;
  config_gt?: string | null /* config_gt */;
  config_gte?: string | null /* config_gte */;
  config_contains?: string | null /* config_contains */;
  config_not_contains?: string | null /* config_not_contains */;
  config_starts_with?: string | null /* config_starts_with */;
  config_not_starts_with?: string | null /* config_not_starts_with */;
  config_ends_with?: string | null /* config_ends_with */;
  config_not_ends_with?: string | null /* config_not_ends_with */;
  builds?: _BuildFilter | null /* builds */;
  builds_not?: _BuildFilter | null /* builds_not */;
  builds_in?: _BuildFilter | null /* builds_in */;
  builds_not_in?: _BuildFilter | null /* builds_not_in */;
  builds_some?: _BuildFilter | null /* builds_some */;
  builds_none?: _BuildFilter | null /* builds_none */;
  builds_single?: _BuildFilter | null /* builds_single */;
  builds_every?: _BuildFilter | null /* builds_every */;
}
/* Filter Input Type for Status */
export interface _StatusFilter {
  AND?: _StatusFilter[] | null /* AND */;
  OR?: _StatusFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  state?: StatusState | null /* state */;
  state_not?: StatusState | null /* state_not */;
  state_in?: StatusState[] | null /* state_in */;
  state_not_in?: StatusState[] | null /* state_not_in */;
  description?: string | null /* description */;
  description_not?: string | null /* description_not */;
  description_in?: string[] | null /* description_in */;
  description_not_in?: string[] | null /* description_not_in */;
  description_lt?: string | null /* description_lt */;
  description_lte?: string | null /* description_lte */;
  description_gt?: string | null /* description_gt */;
  description_gte?: string | null /* description_gte */;
  description_contains?: string | null /* description_contains */;
  description_not_contains?: string | null /* description_not_contains */;
  description_starts_with?: string | null /* description_starts_with */;
  description_not_starts_with?: string | null /* description_not_starts_with */;
  description_ends_with?: string | null /* description_ends_with */;
  description_not_ends_with?: string | null /* description_not_ends_with */;
  targetUrl?: string | null /* targetUrl */;
  targetUrl_not?: string | null /* targetUrl_not */;
  targetUrl_in?: string[] | null /* targetUrl_in */;
  targetUrl_not_in?: string[] | null /* targetUrl_not_in */;
  targetUrl_lt?: string | null /* targetUrl_lt */;
  targetUrl_lte?: string | null /* targetUrl_lte */;
  targetUrl_gt?: string | null /* targetUrl_gt */;
  targetUrl_gte?: string | null /* targetUrl_gte */;
  targetUrl_contains?: string | null /* targetUrl_contains */;
  targetUrl_not_contains?: string | null /* targetUrl_not_contains */;
  targetUrl_starts_with?: string | null /* targetUrl_starts_with */;
  targetUrl_not_starts_with?: string | null /* targetUrl_not_starts_with */;
  targetUrl_ends_with?: string | null /* targetUrl_ends_with */;
  targetUrl_not_ends_with?: string | null /* targetUrl_not_ends_with */;
  context?: string | null /* context */;
  context_not?: string | null /* context_not */;
  context_in?: string[] | null /* context_in */;
  context_not_in?: string[] | null /* context_not_in */;
  context_lt?: string | null /* context_lt */;
  context_lte?: string | null /* context_lte */;
  context_gt?: string | null /* context_gt */;
  context_gte?: string | null /* context_gte */;
  context_contains?: string | null /* context_contains */;
  context_not_contains?: string | null /* context_not_contains */;
  context_starts_with?: string | null /* context_starts_with */;
  context_not_starts_with?: string | null /* context_not_starts_with */;
  context_ends_with?: string | null /* context_ends_with */;
  context_not_ends_with?: string | null /* context_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  commit?: _CommitFilter | null /* commit */;
  commit_not?: _CommitFilter | null /* commit_not */;
  commit_in?: _CommitFilter | null /* commit_in */;
  commit_not_in?: _CommitFilter | null /* commit_not_in */;
}
/* Filter Input Type for HerokuApp */
export interface _HerokuAppFilter {
  AND?: _HerokuAppFilter[] | null /* AND */;
  OR?: _HerokuAppFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  app?: string | null /* app */;
  app_not?: string | null /* app_not */;
  app_in?: string[] | null /* app_in */;
  app_not_in?: string[] | null /* app_not_in */;
  app_lt?: string | null /* app_lt */;
  app_lte?: string | null /* app_lte */;
  app_gt?: string | null /* app_gt */;
  app_gte?: string | null /* app_gte */;
  app_contains?: string | null /* app_contains */;
  app_not_contains?: string | null /* app_not_contains */;
  app_starts_with?: string | null /* app_starts_with */;
  app_not_starts_with?: string | null /* app_not_starts_with */;
  app_ends_with?: string | null /* app_ends_with */;
  app_not_ends_with?: string | null /* app_not_ends_with */;
  url?: string | null /* url */;
  url_not?: string | null /* url_not */;
  url_in?: string[] | null /* url_in */;
  url_not_in?: string[] | null /* url_not_in */;
  url_lt?: string | null /* url_lt */;
  url_lte?: string | null /* url_lte */;
  url_gt?: string | null /* url_gt */;
  url_gte?: string | null /* url_gte */;
  url_contains?: string | null /* url_contains */;
  url_not_contains?: string | null /* url_not_contains */;
  url_starts_with?: string | null /* url_starts_with */;
  url_not_starts_with?: string | null /* url_not_starts_with */;
  url_ends_with?: string | null /* url_ends_with */;
  url_not_ends_with?: string | null /* url_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  user?: string | null /* user */;
  user_not?: string | null /* user_not */;
  user_in?: string[] | null /* user_in */;
  user_not_in?: string[] | null /* user_not_in */;
  user_lt?: string | null /* user_lt */;
  user_lte?: string | null /* user_lte */;
  user_gt?: string | null /* user_gt */;
  user_gte?: string | null /* user_gte */;
  user_contains?: string | null /* user_contains */;
  user_not_contains?: string | null /* user_not_contains */;
  user_starts_with?: string | null /* user_starts_with */;
  user_not_starts_with?: string | null /* user_not_starts_with */;
  user_ends_with?: string | null /* user_ends_with */;
  user_not_ends_with?: string | null /* user_not_ends_with */;
  appId?: string | null /* appId */;
  appId_not?: string | null /* appId_not */;
  appId_in?: string[] | null /* appId_in */;
  appId_not_in?: string[] | null /* appId_not_in */;
  appId_lt?: string | null /* appId_lt */;
  appId_lte?: string | null /* appId_lte */;
  appId_gt?: string | null /* appId_gt */;
  appId_gte?: string | null /* appId_gte */;
  appId_contains?: string | null /* appId_contains */;
  appId_not_contains?: string | null /* appId_not_contains */;
  appId_starts_with?: string | null /* appId_starts_with */;
  appId_not_starts_with?: string | null /* appId_not_starts_with */;
  appId_ends_with?: string | null /* appId_ends_with */;
  appId_not_ends_with?: string | null /* appId_not_ends_with */;
  release?: string | null /* release */;
  release_not?: string | null /* release_not */;
  release_in?: string[] | null /* release_in */;
  release_not_in?: string[] | null /* release_not_in */;
  release_lt?: string | null /* release_lt */;
  release_lte?: string | null /* release_lte */;
  release_gt?: string | null /* release_gt */;
  release_gte?: string | null /* release_gte */;
  release_contains?: string | null /* release_contains */;
  release_not_contains?: string | null /* release_not_contains */;
  release_starts_with?: string | null /* release_starts_with */;
  release_not_starts_with?: string | null /* release_not_starts_with */;
  release_ends_with?: string | null /* release_ends_with */;
  release_not_ends_with?: string | null /* release_not_ends_with */;
  commits?: _CommitFilter | null /* commits */;
  commits_not?: _CommitFilter | null /* commits_not */;
  commits_in?: _CommitFilter | null /* commits_in */;
  commits_not_in?: _CommitFilter | null /* commits_not_in */;
  commits_some?: _CommitFilter | null /* commits_some */;
  commits_none?: _CommitFilter | null /* commits_none */;
  commits_single?: _CommitFilter | null /* commits_single */;
  commits_every?: _CommitFilter | null /* commits_every */;
}
/* Filter Input Type for Application */
export interface _ApplicationFilter {
  AND?: _ApplicationFilter[] | null /* AND */;
  OR?: _ApplicationFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  state?: string | null /* state */;
  state_not?: string | null /* state_not */;
  state_in?: string[] | null /* state_in */;
  state_not_in?: string[] | null /* state_not_in */;
  state_lt?: string | null /* state_lt */;
  state_lte?: string | null /* state_lte */;
  state_gt?: string | null /* state_gt */;
  state_gte?: string | null /* state_gte */;
  state_contains?: string | null /* state_contains */;
  state_not_contains?: string | null /* state_not_contains */;
  state_starts_with?: string | null /* state_starts_with */;
  state_not_starts_with?: string | null /* state_not_starts_with */;
  state_ends_with?: string | null /* state_ends_with */;
  state_not_ends_with?: string | null /* state_not_ends_with */;
  host?: string | null /* host */;
  host_not?: string | null /* host_not */;
  host_in?: string[] | null /* host_in */;
  host_not_in?: string[] | null /* host_not_in */;
  host_lt?: string | null /* host_lt */;
  host_lte?: string | null /* host_lte */;
  host_gt?: string | null /* host_gt */;
  host_gte?: string | null /* host_gte */;
  host_contains?: string | null /* host_contains */;
  host_not_contains?: string | null /* host_not_contains */;
  host_starts_with?: string | null /* host_starts_with */;
  host_not_starts_with?: string | null /* host_not_starts_with */;
  host_ends_with?: string | null /* host_ends_with */;
  host_not_ends_with?: string | null /* host_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  domain?: string | null /* domain */;
  domain_not?: string | null /* domain_not */;
  domain_in?: string[] | null /* domain_in */;
  domain_not_in?: string[] | null /* domain_not_in */;
  domain_lt?: string | null /* domain_lt */;
  domain_lte?: string | null /* domain_lte */;
  domain_gt?: string | null /* domain_gt */;
  domain_gte?: string | null /* domain_gte */;
  domain_contains?: string | null /* domain_contains */;
  domain_not_contains?: string | null /* domain_not_contains */;
  domain_starts_with?: string | null /* domain_starts_with */;
  domain_not_starts_with?: string | null /* domain_not_starts_with */;
  domain_ends_with?: string | null /* domain_ends_with */;
  domain_not_ends_with?: string | null /* domain_not_ends_with */;
  data?: string | null /* data */;
  data_not?: string | null /* data_not */;
  data_in?: string[] | null /* data_in */;
  data_not_in?: string[] | null /* data_not_in */;
  data_lt?: string | null /* data_lt */;
  data_lte?: string | null /* data_lte */;
  data_gt?: string | null /* data_gt */;
  data_gte?: string | null /* data_gte */;
  data_contains?: string | null /* data_contains */;
  data_not_contains?: string | null /* data_not_contains */;
  data_starts_with?: string | null /* data_starts_with */;
  data_not_starts_with?: string | null /* data_not_starts_with */;
  data_ends_with?: string | null /* data_ends_with */;
  data_not_ends_with?: string | null /* data_not_ends_with */;
  commits?: _CommitFilter | null /* commits */;
  commits_not?: _CommitFilter | null /* commits_not */;
  commits_in?: _CommitFilter | null /* commits_in */;
  commits_not_in?: _CommitFilter | null /* commits_not_in */;
  commits_some?: _CommitFilter | null /* commits_some */;
  commits_none?: _CommitFilter | null /* commits_none */;
  commits_single?: _CommitFilter | null /* commits_single */;
  commits_every?: _CommitFilter | null /* commits_every */;
}
/* Filter Input Type for Fingerprint */
export interface _FingerprintFilter {
  AND?: _FingerprintFilter[] | null /* AND */;
  OR?: _FingerprintFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  sha?: string | null /* sha */;
  sha_not?: string | null /* sha_not */;
  sha_in?: string[] | null /* sha_in */;
  sha_not_in?: string[] | null /* sha_not_in */;
  sha_lt?: string | null /* sha_lt */;
  sha_lte?: string | null /* sha_lte */;
  sha_gt?: string | null /* sha_gt */;
  sha_gte?: string | null /* sha_gte */;
  sha_contains?: string | null /* sha_contains */;
  sha_not_contains?: string | null /* sha_not_contains */;
  sha_starts_with?: string | null /* sha_starts_with */;
  sha_not_starts_with?: string | null /* sha_not_starts_with */;
  sha_ends_with?: string | null /* sha_ends_with */;
  sha_not_ends_with?: string | null /* sha_not_ends_with */;
  data?: string | null /* data */;
  data_not?: string | null /* data_not */;
  data_in?: string[] | null /* data_in */;
  data_not_in?: string[] | null /* data_not_in */;
  data_lt?: string | null /* data_lt */;
  data_lte?: string | null /* data_lte */;
  data_gt?: string | null /* data_gt */;
  data_gte?: string | null /* data_gte */;
  data_contains?: string | null /* data_contains */;
  data_not_contains?: string | null /* data_not_contains */;
  data_starts_with?: string | null /* data_starts_with */;
  data_not_starts_with?: string | null /* data_not_starts_with */;
  data_ends_with?: string | null /* data_ends_with */;
  data_not_ends_with?: string | null /* data_not_ends_with */;
  commit?: _CommitFilter | null /* commit */;
  commit_not?: _CommitFilter | null /* commit_not */;
  commit_in?: _CommitFilter | null /* commit_in */;
  commit_not_in?: _CommitFilter | null /* commit_not_in */;
}
/* Filter Input Type for ParentImpact */
export interface _ParentImpactFilter {
  AND?: _ParentImpactFilter[] | null /* AND */;
  OR?: _ParentImpactFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  url?: string | null /* url */;
  url_not?: string | null /* url_not */;
  url_in?: string[] | null /* url_in */;
  url_not_in?: string[] | null /* url_not_in */;
  url_lt?: string | null /* url_lt */;
  url_lte?: string | null /* url_lte */;
  url_gt?: string | null /* url_gt */;
  url_gte?: string | null /* url_gte */;
  url_contains?: string | null /* url_contains */;
  url_not_contains?: string | null /* url_not_contains */;
  url_starts_with?: string | null /* url_starts_with */;
  url_not_starts_with?: string | null /* url_not_starts_with */;
  url_ends_with?: string | null /* url_ends_with */;
  url_not_ends_with?: string | null /* url_not_ends_with */;
  data?: string | null /* data */;
  data_not?: string | null /* data_not */;
  data_in?: string[] | null /* data_in */;
  data_not_in?: string[] | null /* data_not_in */;
  data_lt?: string | null /* data_lt */;
  data_lte?: string | null /* data_lte */;
  data_gt?: string | null /* data_gt */;
  data_gte?: string | null /* data_gte */;
  data_contains?: string | null /* data_contains */;
  data_not_contains?: string | null /* data_not_contains */;
  data_starts_with?: string | null /* data_starts_with */;
  data_not_starts_with?: string | null /* data_not_starts_with */;
  data_ends_with?: string | null /* data_ends_with */;
  data_not_ends_with?: string | null /* data_not_ends_with */;
  commits?: _CommitFilter | null /* commits */;
  commits_not?: _CommitFilter | null /* commits_not */;
  commits_in?: _CommitFilter | null /* commits_in */;
  commits_not_in?: _CommitFilter | null /* commits_not_in */;
  commits_some?: _CommitFilter | null /* commits_some */;
  commits_none?: _CommitFilter | null /* commits_none */;
  commits_single?: _CommitFilter | null /* commits_single */;
  commits_every?: _CommitFilter | null /* commits_every */;
  commit?: _CommitFilter | null /* commit */;
  commit_not?: _CommitFilter | null /* commit_not */;
  commit_in?: _CommitFilter | null /* commit_in */;
  commit_not_in?: _CommitFilter | null /* commit_not_in */;
}
/* Filter Input Type for Branch */
export interface _BranchFilter {
  AND?: _BranchFilter[] | null /* AND */;
  OR?: _BranchFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  isRemote?: boolean | null /* isRemote */;
  isRemote_not?: boolean | null /* isRemote_not */;
  remoteRepoHtmlUrl?: string | null /* remoteRepoHtmlUrl */;
  remoteRepoHtmlUrl_not?: string | null /* remoteRepoHtmlUrl_not */;
  remoteRepoHtmlUrl_in?: string[] | null /* remoteRepoHtmlUrl_in */;
  remoteRepoHtmlUrl_not_in?: string[] | null /* remoteRepoHtmlUrl_not_in */;
  remoteRepoHtmlUrl_lt?: string | null /* remoteRepoHtmlUrl_lt */;
  remoteRepoHtmlUrl_lte?: string | null /* remoteRepoHtmlUrl_lte */;
  remoteRepoHtmlUrl_gt?: string | null /* remoteRepoHtmlUrl_gt */;
  remoteRepoHtmlUrl_gte?: string | null /* remoteRepoHtmlUrl_gte */;
  remoteRepoHtmlUrl_contains?: string | null /* remoteRepoHtmlUrl_contains */;
  remoteRepoHtmlUrl_not_contains?:
    | string
    | null /* remoteRepoHtmlUrl_not_contains */;
  remoteRepoHtmlUrl_starts_with?:
    | string
    | null /* remoteRepoHtmlUrl_starts_with */;
  remoteRepoHtmlUrl_not_starts_with?:
    | string
    | null /* remoteRepoHtmlUrl_not_starts_with */;
  remoteRepoHtmlUrl_ends_with?: string | null /* remoteRepoHtmlUrl_ends_with */;
  remoteRepoHtmlUrl_not_ends_with?:
    | string
    | null /* remoteRepoHtmlUrl_not_ends_with */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
  commit?: _CommitFilter | null /* commit */;
  commit_not?: _CommitFilter | null /* commit_not */;
  commit_in?: _CommitFilter | null /* commit_in */;
  commit_not_in?: _CommitFilter | null /* commit_not_in */;
  pullRequests?: _PullRequestFilter | null /* pullRequests */;
  pullRequests_not?: _PullRequestFilter | null /* pullRequests_not */;
  pullRequests_in?: _PullRequestFilter | null /* pullRequests_in */;
  pullRequests_not_in?: _PullRequestFilter | null /* pullRequests_not_in */;
  pullRequests_some?: _PullRequestFilter | null /* pullRequests_some */;
  pullRequests_none?: _PullRequestFilter | null /* pullRequests_none */;
  pullRequests_single?: _PullRequestFilter | null /* pullRequests_single */;
  pullRequests_every?: _PullRequestFilter | null /* pullRequests_every */;
}
/* Filter Input Type for Review */
export interface _ReviewFilter {
  AND?: _ReviewFilter[] | null /* AND */;
  OR?: _ReviewFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  gitHubId?: string | null /* gitHubId */;
  gitHubId_not?: string | null /* gitHubId_not */;
  gitHubId_in?: string[] | null /* gitHubId_in */;
  gitHubId_not_in?: string[] | null /* gitHubId_not_in */;
  gitHubId_lt?: string | null /* gitHubId_lt */;
  gitHubId_lte?: string | null /* gitHubId_lte */;
  gitHubId_gt?: string | null /* gitHubId_gt */;
  gitHubId_gte?: string | null /* gitHubId_gte */;
  gitHubId_contains?: string | null /* gitHubId_contains */;
  gitHubId_not_contains?: string | null /* gitHubId_not_contains */;
  gitHubId_starts_with?: string | null /* gitHubId_starts_with */;
  gitHubId_not_starts_with?: string | null /* gitHubId_not_starts_with */;
  gitHubId_ends_with?: string | null /* gitHubId_ends_with */;
  gitHubId_not_ends_with?: string | null /* gitHubId_not_ends_with */;
  reviewId?: string | null /* reviewId */;
  reviewId_not?: string | null /* reviewId_not */;
  reviewId_in?: string[] | null /* reviewId_in */;
  reviewId_not_in?: string[] | null /* reviewId_not_in */;
  reviewId_lt?: string | null /* reviewId_lt */;
  reviewId_lte?: string | null /* reviewId_lte */;
  reviewId_gt?: string | null /* reviewId_gt */;
  reviewId_gte?: string | null /* reviewId_gte */;
  reviewId_contains?: string | null /* reviewId_contains */;
  reviewId_not_contains?: string | null /* reviewId_not_contains */;
  reviewId_starts_with?: string | null /* reviewId_starts_with */;
  reviewId_not_starts_with?: string | null /* reviewId_not_starts_with */;
  reviewId_ends_with?: string | null /* reviewId_ends_with */;
  reviewId_not_ends_with?: string | null /* reviewId_not_ends_with */;
  body?: string | null /* body */;
  body_not?: string | null /* body_not */;
  body_in?: string[] | null /* body_in */;
  body_not_in?: string[] | null /* body_not_in */;
  body_lt?: string | null /* body_lt */;
  body_lte?: string | null /* body_lte */;
  body_gt?: string | null /* body_gt */;
  body_gte?: string | null /* body_gte */;
  body_contains?: string | null /* body_contains */;
  body_not_contains?: string | null /* body_not_contains */;
  body_starts_with?: string | null /* body_starts_with */;
  body_not_starts_with?: string | null /* body_not_starts_with */;
  body_ends_with?: string | null /* body_ends_with */;
  body_not_ends_with?: string | null /* body_not_ends_with */;
  state?: ReviewState | null /* state */;
  state_not?: ReviewState | null /* state_not */;
  state_in?: ReviewState[] | null /* state_in */;
  state_not_in?: ReviewState[] | null /* state_not_in */;
  submittedAt?: string | null /* submittedAt */;
  submittedAt_not?: string | null /* submittedAt_not */;
  submittedAt_in?: string[] | null /* submittedAt_in */;
  submittedAt_not_in?: string[] | null /* submittedAt_not_in */;
  submittedAt_lt?: string | null /* submittedAt_lt */;
  submittedAt_lte?: string | null /* submittedAt_lte */;
  submittedAt_gt?: string | null /* submittedAt_gt */;
  submittedAt_gte?: string | null /* submittedAt_gte */;
  submittedAt_contains?: string | null /* submittedAt_contains */;
  submittedAt_not_contains?: string | null /* submittedAt_not_contains */;
  submittedAt_starts_with?: string | null /* submittedAt_starts_with */;
  submittedAt_not_starts_with?: string | null /* submittedAt_not_starts_with */;
  submittedAt_ends_with?: string | null /* submittedAt_ends_with */;
  submittedAt_not_ends_with?: string | null /* submittedAt_not_ends_with */;
  htmlUrl?: string | null /* htmlUrl */;
  htmlUrl_not?: string | null /* htmlUrl_not */;
  htmlUrl_in?: string[] | null /* htmlUrl_in */;
  htmlUrl_not_in?: string[] | null /* htmlUrl_not_in */;
  htmlUrl_lt?: string | null /* htmlUrl_lt */;
  htmlUrl_lte?: string | null /* htmlUrl_lte */;
  htmlUrl_gt?: string | null /* htmlUrl_gt */;
  htmlUrl_gte?: string | null /* htmlUrl_gte */;
  htmlUrl_contains?: string | null /* htmlUrl_contains */;
  htmlUrl_not_contains?: string | null /* htmlUrl_not_contains */;
  htmlUrl_starts_with?: string | null /* htmlUrl_starts_with */;
  htmlUrl_not_starts_with?: string | null /* htmlUrl_not_starts_with */;
  htmlUrl_ends_with?: string | null /* htmlUrl_ends_with */;
  htmlUrl_not_ends_with?: string | null /* htmlUrl_not_ends_with */;
  by?: _SCMIdFilter | null /* by */;
  by_not?: _SCMIdFilter | null /* by_not */;
  by_in?: _SCMIdFilter | null /* by_in */;
  by_not_in?: _SCMIdFilter | null /* by_not_in */;
  by_some?: _SCMIdFilter | null /* by_some */;
  by_none?: _SCMIdFilter | null /* by_none */;
  by_single?: _SCMIdFilter | null /* by_single */;
  by_every?: _SCMIdFilter | null /* by_every */;
  commit?: _CommitFilter | null /* commit */;
  commit_not?: _CommitFilter | null /* commit_not */;
  commit_in?: _CommitFilter | null /* commit_in */;
  commit_not_in?: _CommitFilter | null /* commit_not_in */;
  comments?: _CommentFilter | null /* comments */;
  comments_not?: _CommentFilter | null /* comments_not */;
  comments_in?: _CommentFilter | null /* comments_in */;
  comments_not_in?: _CommentFilter | null /* comments_not_in */;
  comments_some?: _CommentFilter | null /* comments_some */;
  comments_none?: _CommentFilter | null /* comments_none */;
  comments_single?: _CommentFilter | null /* comments_single */;
  comments_every?: _CommentFilter | null /* comments_every */;
  pullRequest?: _PullRequestFilter | null /* pullRequest */;
  pullRequest_not?: _PullRequestFilter | null /* pullRequest_not */;
  pullRequest_in?: _PullRequestFilter | null /* pullRequest_in */;
  pullRequest_not_in?: _PullRequestFilter | null /* pullRequest_not_in */;
}
/* Filter Input Type for Comment */
export interface _CommentFilter {
  AND?: _CommentFilter[] | null /* AND */;
  OR?: _CommentFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  body?: string | null /* body */;
  body_not?: string | null /* body_not */;
  body_in?: string[] | null /* body_in */;
  body_not_in?: string[] | null /* body_not_in */;
  body_lt?: string | null /* body_lt */;
  body_lte?: string | null /* body_lte */;
  body_gt?: string | null /* body_gt */;
  body_gte?: string | null /* body_gte */;
  body_contains?: string | null /* body_contains */;
  body_not_contains?: string | null /* body_not_contains */;
  body_starts_with?: string | null /* body_starts_with */;
  body_not_starts_with?: string | null /* body_not_starts_with */;
  body_ends_with?: string | null /* body_ends_with */;
  body_not_ends_with?: string | null /* body_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  createdAt?: string | null /* createdAt */;
  createdAt_not?: string | null /* createdAt_not */;
  createdAt_in?: string[] | null /* createdAt_in */;
  createdAt_not_in?: string[] | null /* createdAt_not_in */;
  createdAt_lt?: string | null /* createdAt_lt */;
  createdAt_lte?: string | null /* createdAt_lte */;
  createdAt_gt?: string | null /* createdAt_gt */;
  createdAt_gte?: string | null /* createdAt_gte */;
  createdAt_contains?: string | null /* createdAt_contains */;
  createdAt_not_contains?: string | null /* createdAt_not_contains */;
  createdAt_starts_with?: string | null /* createdAt_starts_with */;
  createdAt_not_starts_with?: string | null /* createdAt_not_starts_with */;
  createdAt_ends_with?: string | null /* createdAt_ends_with */;
  createdAt_not_ends_with?: string | null /* createdAt_not_ends_with */;
  updatedAt?: string | null /* updatedAt */;
  updatedAt_not?: string | null /* updatedAt_not */;
  updatedAt_in?: string[] | null /* updatedAt_in */;
  updatedAt_not_in?: string[] | null /* updatedAt_not_in */;
  updatedAt_lt?: string | null /* updatedAt_lt */;
  updatedAt_lte?: string | null /* updatedAt_lte */;
  updatedAt_gt?: string | null /* updatedAt_gt */;
  updatedAt_gte?: string | null /* updatedAt_gte */;
  updatedAt_contains?: string | null /* updatedAt_contains */;
  updatedAt_not_contains?: string | null /* updatedAt_not_contains */;
  updatedAt_starts_with?: string | null /* updatedAt_starts_with */;
  updatedAt_not_starts_with?: string | null /* updatedAt_not_starts_with */;
  updatedAt_ends_with?: string | null /* updatedAt_ends_with */;
  updatedAt_not_ends_with?: string | null /* updatedAt_not_ends_with */;
  commentId?: string | null /* commentId */;
  commentId_not?: string | null /* commentId_not */;
  commentId_in?: string[] | null /* commentId_in */;
  commentId_not_in?: string[] | null /* commentId_not_in */;
  commentId_lt?: string | null /* commentId_lt */;
  commentId_lte?: string | null /* commentId_lte */;
  commentId_gt?: string | null /* commentId_gt */;
  commentId_gte?: string | null /* commentId_gte */;
  commentId_contains?: string | null /* commentId_contains */;
  commentId_not_contains?: string | null /* commentId_not_contains */;
  commentId_starts_with?: string | null /* commentId_starts_with */;
  commentId_not_starts_with?: string | null /* commentId_not_starts_with */;
  commentId_ends_with?: string | null /* commentId_ends_with */;
  commentId_not_ends_with?: string | null /* commentId_not_ends_with */;
  gitHubId?: string | null /* gitHubId */;
  gitHubId_not?: string | null /* gitHubId_not */;
  gitHubId_in?: string[] | null /* gitHubId_in */;
  gitHubId_not_in?: string[] | null /* gitHubId_not_in */;
  gitHubId_lt?: string | null /* gitHubId_lt */;
  gitHubId_lte?: string | null /* gitHubId_lte */;
  gitHubId_gt?: string | null /* gitHubId_gt */;
  gitHubId_gte?: string | null /* gitHubId_gte */;
  gitHubId_contains?: string | null /* gitHubId_contains */;
  gitHubId_not_contains?: string | null /* gitHubId_not_contains */;
  gitHubId_starts_with?: string | null /* gitHubId_starts_with */;
  gitHubId_not_starts_with?: string | null /* gitHubId_not_starts_with */;
  gitHubId_ends_with?: string | null /* gitHubId_ends_with */;
  gitHubId_not_ends_with?: string | null /* gitHubId_not_ends_with */;
  path?: string | null /* path */;
  path_not?: string | null /* path_not */;
  path_in?: string[] | null /* path_in */;
  path_not_in?: string[] | null /* path_not_in */;
  path_lt?: string | null /* path_lt */;
  path_lte?: string | null /* path_lte */;
  path_gt?: string | null /* path_gt */;
  path_gte?: string | null /* path_gte */;
  path_contains?: string | null /* path_contains */;
  path_not_contains?: string | null /* path_not_contains */;
  path_starts_with?: string | null /* path_starts_with */;
  path_not_starts_with?: string | null /* path_not_starts_with */;
  path_ends_with?: string | null /* path_ends_with */;
  path_not_ends_with?: string | null /* path_not_ends_with */;
  position?: string | null /* position */;
  position_not?: string | null /* position_not */;
  position_in?: string[] | null /* position_in */;
  position_not_in?: string[] | null /* position_not_in */;
  position_lt?: string | null /* position_lt */;
  position_lte?: string | null /* position_lte */;
  position_gt?: string | null /* position_gt */;
  position_gte?: string | null /* position_gte */;
  position_contains?: string | null /* position_contains */;
  position_not_contains?: string | null /* position_not_contains */;
  position_starts_with?: string | null /* position_starts_with */;
  position_not_starts_with?: string | null /* position_not_starts_with */;
  position_ends_with?: string | null /* position_ends_with */;
  position_not_ends_with?: string | null /* position_not_ends_with */;
  htmlUrl?: string | null /* htmlUrl */;
  htmlUrl_not?: string | null /* htmlUrl_not */;
  htmlUrl_in?: string[] | null /* htmlUrl_in */;
  htmlUrl_not_in?: string[] | null /* htmlUrl_not_in */;
  htmlUrl_lt?: string | null /* htmlUrl_lt */;
  htmlUrl_lte?: string | null /* htmlUrl_lte */;
  htmlUrl_gt?: string | null /* htmlUrl_gt */;
  htmlUrl_gte?: string | null /* htmlUrl_gte */;
  htmlUrl_contains?: string | null /* htmlUrl_contains */;
  htmlUrl_not_contains?: string | null /* htmlUrl_not_contains */;
  htmlUrl_starts_with?: string | null /* htmlUrl_starts_with */;
  htmlUrl_not_starts_with?: string | null /* htmlUrl_not_starts_with */;
  htmlUrl_ends_with?: string | null /* htmlUrl_ends_with */;
  htmlUrl_not_ends_with?: string | null /* htmlUrl_not_ends_with */;
  commentType?: CommentCommentType | null /* commentType */;
  commentType_not?: CommentCommentType | null /* commentType_not */;
  commentType_in?: CommentCommentType[] | null /* commentType_in */;
  commentType_not_in?: CommentCommentType[] | null /* commentType_not_in */;
  issue?: _IssueFilter | null /* issue */;
  issue_not?: _IssueFilter | null /* issue_not */;
  issue_in?: _IssueFilter | null /* issue_in */;
  issue_not_in?: _IssueFilter | null /* issue_not_in */;
  review?: _ReviewFilter | null /* review */;
  review_not?: _ReviewFilter | null /* review_not */;
  review_in?: _ReviewFilter | null /* review_in */;
  review_not_in?: _ReviewFilter | null /* review_not_in */;
  pullRequest?: _PullRequestFilter | null /* pullRequest */;
  pullRequest_not?: _PullRequestFilter | null /* pullRequest_not */;
  pullRequest_in?: _PullRequestFilter | null /* pullRequest_in */;
  pullRequest_not_in?: _PullRequestFilter | null /* pullRequest_not_in */;
  by?: _SCMIdFilter | null /* by */;
  by_not?: _SCMIdFilter | null /* by_not */;
  by_in?: _SCMIdFilter | null /* by_in */;
  by_not_in?: _SCMIdFilter | null /* by_not_in */;
}
/* Filter Input Type for DeletedBranch */
export interface _DeletedBranchFilter {
  AND?: _DeletedBranchFilter[] | null /* AND */;
  OR?: _DeletedBranchFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  name?: string | null /* name */;
  name_not?: string | null /* name_not */;
  name_in?: string[] | null /* name_in */;
  name_not_in?: string[] | null /* name_not_in */;
  name_lt?: string | null /* name_lt */;
  name_lte?: string | null /* name_lte */;
  name_gt?: string | null /* name_gt */;
  name_gte?: string | null /* name_gte */;
  name_contains?: string | null /* name_contains */;
  name_not_contains?: string | null /* name_not_contains */;
  name_starts_with?: string | null /* name_starts_with */;
  name_not_starts_with?: string | null /* name_not_starts_with */;
  name_ends_with?: string | null /* name_ends_with */;
  name_not_ends_with?: string | null /* name_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  repo?: _RepoFilter | null /* repo */;
  repo_not?: _RepoFilter | null /* repo_not */;
  repo_in?: _RepoFilter | null /* repo_in */;
  repo_not_in?: _RepoFilter | null /* repo_not_in */;
  commit?: _CommitFilter | null /* commit */;
  commit_not?: _CommitFilter | null /* commit_not */;
  commit_in?: _CommitFilter | null /* commit_in */;
  commit_not_in?: _CommitFilter | null /* commit_not_in */;
  pullRequests?: _PullRequestFilter | null /* pullRequests */;
  pullRequests_not?: _PullRequestFilter | null /* pullRequests_not */;
  pullRequests_in?: _PullRequestFilter | null /* pullRequests_in */;
  pullRequests_not_in?: _PullRequestFilter | null /* pullRequests_not_in */;
  pullRequests_some?: _PullRequestFilter | null /* pullRequests_some */;
  pullRequests_none?: _PullRequestFilter | null /* pullRequests_none */;
  pullRequests_single?: _PullRequestFilter | null /* pullRequests_single */;
  pullRequests_every?: _PullRequestFilter | null /* pullRequests_every */;
}
/* Filter Input Type for ImageLinked */
export interface _ImageLinkedFilter {
  AND?: _ImageLinkedFilter[] | null /* AND */;
  OR?: _ImageLinkedFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  timestamp?: string | null /* timestamp */;
  timestamp_not?: string | null /* timestamp_not */;
  timestamp_in?: string[] | null /* timestamp_in */;
  timestamp_not_in?: string[] | null /* timestamp_not_in */;
  timestamp_lt?: string | null /* timestamp_lt */;
  timestamp_lte?: string | null /* timestamp_lte */;
  timestamp_gt?: string | null /* timestamp_gt */;
  timestamp_gte?: string | null /* timestamp_gte */;
  timestamp_contains?: string | null /* timestamp_contains */;
  timestamp_not_contains?: string | null /* timestamp_not_contains */;
  timestamp_starts_with?: string | null /* timestamp_starts_with */;
  timestamp_not_starts_with?: string | null /* timestamp_not_starts_with */;
  timestamp_ends_with?: string | null /* timestamp_ends_with */;
  timestamp_not_ends_with?: string | null /* timestamp_not_ends_with */;
  image?: _DockerImageFilter | null /* image */;
  image_not?: _DockerImageFilter | null /* image_not */;
  image_in?: _DockerImageFilter | null /* image_in */;
  image_not_in?: _DockerImageFilter | null /* image_not_in */;
  commit?: _CommitFilter | null /* commit */;
  commit_not?: _CommitFilter | null /* commit_not */;
  commit_in?: _CommitFilter | null /* commit_in */;
  commit_not_in?: _CommitFilter | null /* commit_not_in */;
}
/* Filter Input Type for PushImpact */
export interface _PushImpactFilter {
  AND?: _PushImpactFilter[] | null /* AND */;
  OR?: _PushImpactFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  url?: string | null /* url */;
  url_not?: string | null /* url_not */;
  url_in?: string[] | null /* url_in */;
  url_not_in?: string[] | null /* url_not_in */;
  url_lt?: string | null /* url_lt */;
  url_lte?: string | null /* url_lte */;
  url_gt?: string | null /* url_gt */;
  url_gte?: string | null /* url_gte */;
  url_contains?: string | null /* url_contains */;
  url_not_contains?: string | null /* url_not_contains */;
  url_starts_with?: string | null /* url_starts_with */;
  url_not_starts_with?: string | null /* url_not_starts_with */;
  url_ends_with?: string | null /* url_ends_with */;
  url_not_ends_with?: string | null /* url_not_ends_with */;
  data?: string | null /* data */;
  data_not?: string | null /* data_not */;
  data_in?: string[] | null /* data_in */;
  data_not_in?: string[] | null /* data_not_in */;
  data_lt?: string | null /* data_lt */;
  data_lte?: string | null /* data_lte */;
  data_gt?: string | null /* data_gt */;
  data_gte?: string | null /* data_gte */;
  data_contains?: string | null /* data_contains */;
  data_not_contains?: string | null /* data_not_contains */;
  data_starts_with?: string | null /* data_starts_with */;
  data_not_starts_with?: string | null /* data_not_starts_with */;
  data_ends_with?: string | null /* data_ends_with */;
  data_not_ends_with?: string | null /* data_not_ends_with */;
  push?: _PushFilter | null /* push */;
  push_not?: _PushFilter | null /* push_not */;
  push_in?: _PushFilter | null /* push_in */;
  push_not_in?: _PushFilter | null /* push_not_in */;
}
/* Filter Input Type for PullRequestImpact */
export interface _PullRequestImpactFilter {
  AND?: _PullRequestImpactFilter[] | null /* AND */;
  OR?: _PullRequestImpactFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  url?: string | null /* url */;
  url_not?: string | null /* url_not */;
  url_in?: string[] | null /* url_in */;
  url_not_in?: string[] | null /* url_not_in */;
  url_lt?: string | null /* url_lt */;
  url_lte?: string | null /* url_lte */;
  url_gt?: string | null /* url_gt */;
  url_gte?: string | null /* url_gte */;
  url_contains?: string | null /* url_contains */;
  url_not_contains?: string | null /* url_not_contains */;
  url_starts_with?: string | null /* url_starts_with */;
  url_not_starts_with?: string | null /* url_not_starts_with */;
  url_ends_with?: string | null /* url_ends_with */;
  url_not_ends_with?: string | null /* url_not_ends_with */;
  data?: string | null /* data */;
  data_not?: string | null /* data_not */;
  data_in?: string[] | null /* data_in */;
  data_not_in?: string[] | null /* data_not_in */;
  data_lt?: string | null /* data_lt */;
  data_lte?: string | null /* data_lte */;
  data_gt?: string | null /* data_gt */;
  data_gte?: string | null /* data_gte */;
  data_contains?: string | null /* data_contains */;
  data_not_contains?: string | null /* data_not_contains */;
  data_starts_with?: string | null /* data_starts_with */;
  data_not_starts_with?: string | null /* data_not_starts_with */;
  data_ends_with?: string | null /* data_ends_with */;
  data_not_ends_with?: string | null /* data_not_ends_with */;
  pullRequest?: _PullRequestFilter | null /* pullRequest */;
  pullRequest_not?: _PullRequestFilter | null /* pullRequest_not */;
  pullRequest_in?: _PullRequestFilter | null /* pullRequest_in */;
  pullRequest_not_in?: _PullRequestFilter | null /* pullRequest_not_in */;
}
/* Filter Input Type for UserJoinedChannel */
export interface _UserJoinedChannelFilter {
  AND?: _UserJoinedChannelFilter[] | null /* AND */;
  OR?: _UserJoinedChannelFilter[] | null /* OR */;
  atmTeamId?: string | null /* atmTeamId */;
  atmTeamId_not?: string | null /* atmTeamId_not */;
  atmTeamId_in?: string[] | null /* atmTeamId_in */;
  atmTeamId_not_in?: string[] | null /* atmTeamId_not_in */;
  atmTeamId_lt?: string | null /* atmTeamId_lt */;
  atmTeamId_lte?: string | null /* atmTeamId_lte */;
  atmTeamId_gt?: string | null /* atmTeamId_gt */;
  atmTeamId_gte?: string | null /* atmTeamId_gte */;
  atmTeamId_contains?: string | null /* atmTeamId_contains */;
  atmTeamId_not_contains?: string | null /* atmTeamId_not_contains */;
  atmTeamId_starts_with?: string | null /* atmTeamId_starts_with */;
  atmTeamId_not_starts_with?: string | null /* atmTeamId_not_starts_with */;
  atmTeamId_ends_with?: string | null /* atmTeamId_ends_with */;
  atmTeamId_not_ends_with?: string | null /* atmTeamId_not_ends_with */;
  id?: string | null /* id */;
  id_not?: string | null /* id_not */;
  id_in?: string[] | null /* id_in */;
  id_not_in?: string[] | null /* id_not_in */;
  id_lt?: string | null /* id_lt */;
  id_lte?: string | null /* id_lte */;
  id_gt?: string | null /* id_gt */;
  id_gte?: string | null /* id_gte */;
  id_contains?: string | null /* id_contains */;
  id_not_contains?: string | null /* id_not_contains */;
  id_starts_with?: string | null /* id_starts_with */;
  id_not_starts_with?: string | null /* id_not_starts_with */;
  id_ends_with?: string | null /* id_ends_with */;
  id_not_ends_with?: string | null /* id_not_ends_with */;
  user?: _ChatIdFilter | null /* user */;
  user_not?: _ChatIdFilter | null /* user_not */;
  user_in?: _ChatIdFilter | null /* user_in */;
  user_not_in?: _ChatIdFilter | null /* user_not_in */;
  channel?: _ChatChannelFilter | null /* channel */;
  channel_not?: _ChatChannelFilter | null /* channel_not */;
  channel_in?: _ChatChannelFilter | null /* channel_in */;
  channel_not_in?: _ChatChannelFilter | null /* channel_not_in */;
}
/* Enum for IssueState */
export enum IssueState {
  open = "open",
  closed = "closed"
}

/* Ordering Enum for Issue */
export enum _IssueOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  number_asc = "number_asc",
  number_desc = "number_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  title_asc = "title_asc",
  title_desc = "title_desc",
  body_asc = "body_asc",
  body_desc = "body_desc",
  state_asc = "state_asc",
  state_desc = "state_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  action_asc = "action_asc",
  action_desc = "action_desc",
  createdAt_asc = "createdAt_asc",
  createdAt_desc = "createdAt_desc",
  updatedAt_asc = "updatedAt_asc",
  updatedAt_desc = "updatedAt_desc",
  closedAt_asc = "closedAt_asc",
  closedAt_desc = "closedAt_desc"
}

/* Enum for ProviderType */
export enum ProviderType {
  bitbucket_cloud = "bitbucket_cloud",
  github_com = "github_com",
  ghe = "ghe",
  bitbucket = "bitbucket",
  gitlab = "gitlab"
}

/* Enum for OwnerType */
export enum OwnerType {
  user = "user",
  organization = "organization"
}

/* Enum for WebhookType */
export enum WebhookType {
  organization = "organization",
  repository = "repository"
}

/* Enum for MergeStatus */
export enum MergeStatus {
  can_be_merged = "can_be_merged",
  unchecked = "unchecked",
  cannot_be_merged = "cannot_be_merged"
}

/* Enum for BuildStatus */
export enum BuildStatus {
  passed = "passed",
  broken = "broken",
  failed = "failed",
  started = "started",
  canceled = "canceled"
}

/* Enum for BuildTrigger */
export enum BuildTrigger {
  pull_request = "pull_request",
  push = "push",
  tag = "tag",
  cron = "cron"
}

/* Enum for StatusState */
export enum StatusState {
  pending = "pending",
  success = "success",
  error = "error",
  failure = "failure"
}

/* Enum for ReviewState */
export enum ReviewState {
  requested = "requested",
  pending = "pending",
  approved = "approved",
  commented = "commented",
  unapproved = "unapproved",
  changes_requested = "changes_requested"
}

/* Enum for CommentCommentType */
export enum CommentCommentType {
  review = "review",
  pullRequest = "pullRequest",
  issue = "issue"
}

/* Ordering Enum for Repo */
export enum _RepoOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  owner_asc = "owner_asc",
  owner_desc = "owner_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  allowRebaseMerge_asc = "allowRebaseMerge_asc",
  allowRebaseMerge_desc = "allowRebaseMerge_desc",
  allowSquashMerge_asc = "allowSquashMerge_asc",
  allowSquashMerge_desc = "allowSquashMerge_desc",
  allowMergeCommit_asc = "allowMergeCommit_asc",
  allowMergeCommit_desc = "allowMergeCommit_desc",
  repoId_asc = "repoId_asc",
  repoId_desc = "repoId_desc",
  gitHubId_asc = "gitHubId_asc",
  gitHubId_desc = "gitHubId_desc",
  defaultBranch_asc = "defaultBranch_asc",
  defaultBranch_desc = "defaultBranch_desc"
}

/* Ordering Enum for Label */
export enum _LabelOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  default_asc = "default_asc",
  default_desc = "default_desc",
  color_asc = "color_asc",
  color_desc = "color_desc"
}

/* Ordering Enum for ChatChannel */
export enum _ChatChannelOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  provider_asc = "provider_asc",
  provider_desc = "provider_desc",
  normalizedName_asc = "normalizedName_asc",
  normalizedName_desc = "normalizedName_desc",
  channelId_asc = "channelId_asc",
  channelId_desc = "channelId_desc",
  isDefault_asc = "isDefault_asc",
  isDefault_desc = "isDefault_desc",
  botInvitedSelf_asc = "botInvitedSelf_asc",
  botInvitedSelf_desc = "botInvitedSelf_desc",
  archived_asc = "archived_asc",
  archived_desc = "archived_desc"
}

/* Ordering Enum for ChatId */
export enum _ChatIdOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  screenName_asc = "screenName_asc",
  screenName_desc = "screenName_desc",
  userId_asc = "userId_asc",
  userId_desc = "userId_desc",
  provider_asc = "provider_asc",
  provider_desc = "provider_desc",
  isAtomistBot_asc = "isAtomistBot_asc",
  isAtomistBot_desc = "isAtomistBot_desc",
  isOwner_asc = "isOwner_asc",
  isOwner_desc = "isOwner_desc",
  isPrimaryOwner_asc = "isPrimaryOwner_asc",
  isPrimaryOwner_desc = "isPrimaryOwner_desc",
  isAdmin_asc = "isAdmin_asc",
  isAdmin_desc = "isAdmin_desc",
  isBot_asc = "isBot_asc",
  isBot_desc = "isBot_desc",
  timezoneLabel_asc = "timezoneLabel_asc",
  timezoneLabel_desc = "timezoneLabel_desc"
}

/* Ordering Enum for Email */
export enum _EmailOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  address_asc = "address_asc",
  address_desc = "address_desc"
}

/* Ordering Enum for SCMId */
export enum _SCMIdOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  login_asc = "login_asc",
  login_desc = "login_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  avatar_asc = "avatar_asc",
  avatar_desc = "avatar_desc"
}

/* Ordering Enum for GitHubProvider */
export enum _GitHubProviderOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  url_asc = "url_asc",
  url_desc = "url_desc",
  providerId_asc = "providerId_asc",
  providerId_desc = "providerId_desc",
  apiUrl_asc = "apiUrl_asc",
  apiUrl_desc = "apiUrl_desc",
  gitUrl_asc = "gitUrl_asc",
  gitUrl_desc = "gitUrl_desc",
  providerType_asc = "providerType_asc",
  providerType_desc = "providerType_desc"
}

/* Ordering Enum for Team */
export enum _TeamOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  description_asc = "description_asc",
  description_desc = "description_desc",
  iconUrl_asc = "iconUrl_asc",
  iconUrl_desc = "iconUrl_desc",
  createdAt_asc = "createdAt_asc",
  createdAt_desc = "createdAt_desc"
}

/* Ordering Enum for Person */
export enum _PersonOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  forename_asc = "forename_asc",
  forename_desc = "forename_desc",
  surname_asc = "surname_asc",
  surname_desc = "surname_desc",
  name_asc = "name_asc",
  name_desc = "name_desc"
}

/* Ordering Enum for GitHubId */
export enum _GitHubIdOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  login_asc = "login_asc",
  login_desc = "login_desc",
  name_asc = "name_asc",
  name_desc = "name_desc"
}

/* Ordering Enum for SCMProvider */
export enum _SCMProviderOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  url_asc = "url_asc",
  url_desc = "url_desc",
  providerId_asc = "providerId_asc",
  providerId_desc = "providerId_desc",
  apiUrl_asc = "apiUrl_asc",
  apiUrl_desc = "apiUrl_desc",
  gitUrl_asc = "gitUrl_asc",
  gitUrl_desc = "gitUrl_desc",
  providerType_asc = "providerType_asc",
  providerType_desc = "providerType_desc"
}

/* Ordering Enum for Org */
export enum _OrgOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  owner_asc = "owner_asc",
  owner_desc = "owner_desc",
  ownerType_asc = "ownerType_asc",
  ownerType_desc = "ownerType_desc"
}

/* Ordering Enum for GitHubOrgWebhook */
export enum _GitHubOrgWebhookOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  url_asc = "url_asc",
  url_desc = "url_desc",
  webhookType_asc = "webhookType_asc",
  webhookType_desc = "webhookType_desc"
}

/* Ordering Enum for Webhook */
export enum _WebhookOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  url_asc = "url_asc",
  url_desc = "url_desc",
  webhookType_asc = "webhookType_asc",
  webhookType_desc = "webhookType_desc"
}

/* Ordering Enum for ChatTeam */
export enum _ChatTeamOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  provider_asc = "provider_asc",
  provider_desc = "provider_desc",
  domain_asc = "domain_asc",
  domain_desc = "domain_desc",
  messageCount_asc = "messageCount_asc",
  messageCount_desc = "messageCount_desc",
  emailDomain_asc = "emailDomain_asc",
  emailDomain_desc = "emailDomain_desc"
}

/* Ordering Enum for ChannelLink */
export enum _ChannelLinkOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc"
}

/* Ordering Enum for PullRequest */
export enum _PullRequestOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  number_asc = "number_asc",
  number_desc = "number_desc",
  prId_asc = "prId_asc",
  prId_desc = "prId_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  body_asc = "body_asc",
  body_desc = "body_desc",
  state_asc = "state_asc",
  state_desc = "state_desc",
  merged_asc = "merged_asc",
  merged_desc = "merged_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  baseBranchName_asc = "baseBranchName_asc",
  baseBranchName_desc = "baseBranchName_desc",
  branchName_asc = "branchName_asc",
  branchName_desc = "branchName_desc",
  title_asc = "title_asc",
  title_desc = "title_desc",
  createdAt_asc = "createdAt_asc",
  createdAt_desc = "createdAt_desc",
  updatedAt_asc = "updatedAt_asc",
  updatedAt_desc = "updatedAt_desc",
  closedAt_asc = "closedAt_asc",
  closedAt_desc = "closedAt_desc",
  mergedAt_asc = "mergedAt_asc",
  mergedAt_desc = "mergedAt_desc",
  mergeStatus_asc = "mergeStatus_asc",
  mergeStatus_desc = "mergeStatus_desc"
}

/* Ordering Enum for Commit */
export enum _CommitOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  sha_asc = "sha_asc",
  sha_desc = "sha_desc",
  message_asc = "message_asc",
  message_desc = "message_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc"
}

/* Ordering Enum for Build */
export enum _BuildOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  buildId_asc = "buildId_asc",
  buildId_desc = "buildId_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  status_asc = "status_asc",
  status_desc = "status_desc",
  buildUrl_asc = "buildUrl_asc",
  buildUrl_desc = "buildUrl_desc",
  compareUrl_asc = "compareUrl_asc",
  compareUrl_desc = "compareUrl_desc",
  trigger_asc = "trigger_asc",
  trigger_desc = "trigger_desc",
  provider_asc = "provider_asc",
  provider_desc = "provider_desc",
  pullRequestNumber_asc = "pullRequestNumber_asc",
  pullRequestNumber_desc = "pullRequestNumber_desc",
  startedAt_asc = "startedAt_asc",
  startedAt_desc = "startedAt_desc",
  finishedAt_asc = "finishedAt_asc",
  finishedAt_desc = "finishedAt_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  workflowId_asc = "workflowId_asc",
  workflowId_desc = "workflowId_desc",
  jobName_asc = "jobName_asc",
  jobName_desc = "jobName_desc",
  jobId_asc = "jobId_asc",
  jobId_desc = "jobId_desc",
  data_asc = "data_asc",
  data_desc = "data_desc"
}

/* Ordering Enum for Push */
export enum _PushOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  branch_asc = "branch_asc",
  branch_desc = "branch_desc"
}

export enum SdmGoalState {
  success = "success",
  requested = "requested",
  approved = "approved",
  waiting_for_approval = "waiting_for_approval",
  failure = "failure",
  planned = "planned",
  in_process = "in_process",
  skipped = "skipped"
}

/* Ordering Enum for Tag */
export enum _TagOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  description_asc = "description_asc",
  description_desc = "description_desc",
  ref_asc = "ref_asc",
  ref_desc = "ref_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc"
}

/* Ordering Enum for Release */
export enum _ReleaseOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc"
}

/* Ordering Enum for DockerImage */
export enum _DockerImageOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  image_asc = "image_asc",
  image_desc = "image_desc",
  imageName_asc = "imageName_asc",
  imageName_desc = "imageName_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc"
}

/* Ordering Enum for K8Pod */
export enum _K8PodOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  phase_asc = "phase_asc",
  phase_desc = "phase_desc",
  environment_asc = "environment_asc",
  environment_desc = "environment_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  baseName_asc = "baseName_asc",
  baseName_desc = "baseName_desc",
  namespace_asc = "namespace_asc",
  namespace_desc = "namespace_desc",
  statusJSON_asc = "statusJSON_asc",
  statusJSON_desc = "statusJSON_desc",
  host_asc = "host_asc",
  host_desc = "host_desc",
  state_asc = "state_asc",
  state_desc = "state_desc",
  specsJSON_asc = "specsJSON_asc",
  specsJSON_desc = "specsJSON_desc",
  envJSON_asc = "envJSON_asc",
  envJSON_desc = "envJSON_desc",
  metadataJSON_asc = "metadataJSON_asc",
  metadataJSON_desc = "metadataJSON_desc",
  containersCrashLoopBackOff_asc = "containersCrashLoopBackOff_asc",
  containersCrashLoopBackOff_desc = "containersCrashLoopBackOff_desc",
  resourceVersion_asc = "resourceVersion_asc",
  resourceVersion_desc = "resourceVersion_desc"
}

/* Ordering Enum for K8Container */
export enum _K8ContainerOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  imageName_asc = "imageName_asc",
  imageName_desc = "imageName_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  environment_asc = "environment_asc",
  environment_desc = "environment_desc",
  containerJSON_asc = "containerJSON_asc",
  containerJSON_desc = "containerJSON_desc",
  state_asc = "state_asc",
  state_desc = "state_desc",
  stateReason_asc = "stateReason_asc",
  stateReason_desc = "stateReason_desc",
  ready_asc = "ready_asc",
  ready_desc = "ready_desc",
  restartCount_asc = "restartCount_asc",
  restartCount_desc = "restartCount_desc",
  statusJSON_asc = "statusJSON_asc",
  statusJSON_desc = "statusJSON_desc",
  resourceVersion_asc = "resourceVersion_asc",
  resourceVersion_desc = "resourceVersion_desc",
  containerID_asc = "containerID_asc",
  containerID_desc = "containerID_desc"
}

/* Ordering Enum for Workflow */
export enum _WorkflowOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  workflowId_asc = "workflowId_asc",
  workflowId_desc = "workflowId_desc",
  provider_asc = "provider_asc",
  provider_desc = "provider_desc",
  config_asc = "config_asc",
  config_desc = "config_desc"
}

/* Ordering Enum for Status */
export enum _StatusOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  state_asc = "state_asc",
  state_desc = "state_desc",
  description_asc = "description_asc",
  description_desc = "description_desc",
  targetUrl_asc = "targetUrl_asc",
  targetUrl_desc = "targetUrl_desc",
  context_asc = "context_asc",
  context_desc = "context_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc"
}

/* Ordering Enum for HerokuApp */
export enum _HerokuAppOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  app_asc = "app_asc",
  app_desc = "app_desc",
  url_asc = "url_asc",
  url_desc = "url_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  user_asc = "user_asc",
  user_desc = "user_desc",
  appId_asc = "appId_asc",
  appId_desc = "appId_desc",
  release_asc = "release_asc",
  release_desc = "release_desc"
}

/* Ordering Enum for Application */
export enum _ApplicationOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  state_asc = "state_asc",
  state_desc = "state_desc",
  host_asc = "host_asc",
  host_desc = "host_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  domain_asc = "domain_asc",
  domain_desc = "domain_desc",
  data_asc = "data_asc",
  data_desc = "data_desc"
}

/* Ordering Enum for Fingerprint */
export enum _FingerprintOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  sha_asc = "sha_asc",
  sha_desc = "sha_desc",
  data_asc = "data_asc",
  data_desc = "data_desc"
}

/* Ordering Enum for ParentImpact */
export enum _ParentImpactOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  url_asc = "url_asc",
  url_desc = "url_desc",
  data_asc = "data_asc",
  data_desc = "data_desc"
}

/* Ordering Enum for Branch */
export enum _BranchOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  isRemote_asc = "isRemote_asc",
  isRemote_desc = "isRemote_desc",
  remoteRepoHtmlUrl_asc = "remoteRepoHtmlUrl_asc",
  remoteRepoHtmlUrl_desc = "remoteRepoHtmlUrl_desc"
}

/* Ordering Enum for Review */
export enum _ReviewOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  gitHubId_asc = "gitHubId_asc",
  gitHubId_desc = "gitHubId_desc",
  reviewId_asc = "reviewId_asc",
  reviewId_desc = "reviewId_desc",
  body_asc = "body_asc",
  body_desc = "body_desc",
  state_asc = "state_asc",
  state_desc = "state_desc",
  submittedAt_asc = "submittedAt_asc",
  submittedAt_desc = "submittedAt_desc",
  htmlUrl_asc = "htmlUrl_asc",
  htmlUrl_desc = "htmlUrl_desc"
}

/* Ordering Enum for Comment */
export enum _CommentOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  body_asc = "body_asc",
  body_desc = "body_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc",
  createdAt_asc = "createdAt_asc",
  createdAt_desc = "createdAt_desc",
  updatedAt_asc = "updatedAt_asc",
  updatedAt_desc = "updatedAt_desc",
  commentId_asc = "commentId_asc",
  commentId_desc = "commentId_desc",
  gitHubId_asc = "gitHubId_asc",
  gitHubId_desc = "gitHubId_desc",
  path_asc = "path_asc",
  path_desc = "path_desc",
  position_asc = "position_asc",
  position_desc = "position_desc",
  htmlUrl_asc = "htmlUrl_asc",
  htmlUrl_desc = "htmlUrl_desc",
  commentType_asc = "commentType_asc",
  commentType_desc = "commentType_desc"
}

/* Ordering Enum for DeletedBranch */
export enum _DeletedBranchOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  name_asc = "name_asc",
  name_desc = "name_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc"
}

/* Ordering Enum for ImageLinked */
export enum _ImageLinkedOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  timestamp_asc = "timestamp_asc",
  timestamp_desc = "timestamp_desc"
}

/* Ordering Enum for PushImpact */
export enum _PushImpactOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  url_asc = "url_asc",
  url_desc = "url_desc",
  data_asc = "data_asc",
  data_desc = "data_desc"
}

/* Ordering Enum for PullRequestImpact */
export enum _PullRequestImpactOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc",
  url_asc = "url_asc",
  url_desc = "url_desc",
  data_asc = "data_asc",
  data_desc = "data_desc"
}

/* Ordering Enum for UserJoinedChannel */
export enum _UserJoinedChannelOrdering {
  atmTeamId_asc = "atmTeamId_asc",
  atmTeamId_desc = "atmTeamId_desc",
  id_asc = "id_asc",
  id_desc = "id_desc"
}

/* asc or desc ordering. Must be used with orderBy */
export enum _Ordering {
  desc = "desc",
  asc = "asc"
}

export enum CommitIssueRelationshipType {
  fixes = "fixes",
  references = "references"
}

export enum SdmDeployState {
  requested = "requested",
  disabled = "disabled"
}

export namespace CommitForSdmGoal {
  export type Variables = {
    sha: string;
    repo: string;
    owner: string;
    branch: string;
  };

  export type Query = {
    __typename?: "Query";
    Commit?: Commit[] | null;
  };

  export type Commit = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    statuses?: Statuses[] | null;
    repo?: Repo | null;
    pushes?: Pushes[] | null;
    image?: Image | null;
  };

  export type Statuses = {
    __typename?: "Status";
    context?: string | null;
    description?: string | null;
    state?: StatusState | null;
    targetUrl?: string | null;
  };

  export type Repo = CoreRepoFieldsAndChannels.Fragment;

  export type Pushes = PushFields.Fragment;

  export type Image = {
    __typename?: "DockerImage";
    image?: string | null;
    imageName?: string | null;
  };
}
export namespace GitHubLogin {
  export type Variables = {
    userId: string;
    owner: string;
    providerId: string;
  };

  export type Query = {
    __typename?: "Query";
    Team?: Team[] | null;
  };

  export type Team = {
    __typename?: "Team";
    chatTeams?: ChatTeams[] | null;
    orgs?: Orgs[] | null;
  };

  export type ChatTeams = {
    __typename?: "ChatTeam";
    members?: Members[] | null;
  };

  export type Members = {
    __typename?: "ChatId";
    person?: Person | null;
  };

  export type Person = {
    __typename?: "Person";
    gitHubId?: GitHubId | null;
  };

  export type GitHubId = {
    __typename?: "GitHubId";
    login?: string | null;
  };

  export type Orgs = {
    __typename?: "Org";
    provider?: Provider | null;
  };

  export type Provider = {
    __typename?: "GitHubProvider";
    apiUrl?: string | null;
  };
}
export namespace PullRequestsForBranch {
  export type Variables = {
    owner: string;
    repo: string;
    branch: string;
  };

  export type Query = {
    __typename?: "Query";
    Repo?: Repo[] | null;
  };

  export type Repo = {
    __typename?: "Repo";
    branches?: Branches[] | null;
  };

  export type Branches = {
    __typename?: "Branch";
    name?: string | null;
    pullRequests?: PullRequests[] | null;
  };

  export type PullRequests = {
    __typename?: "PullRequest";
    state?: string | null;
  };
}
export namespace PushForSdmGoal {
  export type Variables = {
    owner: string;
    repo: string;
    providerId: string;
    branch: string;
    sha: string;
  };

  export type Query = {
    __typename?: "Query";
    Commit?: Commit[] | null;
  };

  export type Commit = {
    __typename?: "Commit";
    pushes?: Pushes[] | null;
  };

  export type Pushes = {
    __typename?: "Push";
    id?: string | null;
    timestamp?: string | null;
    branch?: string | null;
    before?: Before | null;
    after?: After | null;
    commits?: Commits[] | null;
    repo?: Repo | null;
  };

  export type Before = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    committer?: Committer | null;
  };

  export type Committer = {
    __typename?: "SCMId";
    login?: string | null;
    person?: Person | null;
  };

  export type Person = PersonFields.Fragment;

  export type After = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    committer?: _Committer | null;
  };

  export type _Committer = {
    __typename?: "SCMId";
    login?: string | null;
    person?: _Person | null;
  };

  export type _Person = PersonFields.Fragment;

  export type Commits = {
    __typename?: "Commit";
    sha?: string | null;
    timestamp?: string | null;
    message?: string | null;
    author?: Author | null;
  };

  export type Author = {
    __typename?: "SCMId";
    login?: string | null;
    name?: string | null;
  };

  export type Repo = {
    __typename?: "Repo";
    owner?: string | null;
    name?: string | null;
    org?: Org | null;
    channels?: Channels[] | null;
    defaultBranch?: string | null;
  };

  export type Org = {
    __typename?: "Org";
    owner?: string | null;
    ownerType?: OwnerType | null;
    provider?: Provider | null;
  };

  export type Provider = {
    __typename?: "GitHubProvider";
    providerId?: string | null;
    providerType?: ProviderType | null;
    apiUrl?: string | null;
    url?: string | null;
  };

  export type Channels = {
    __typename?: "ChatChannel";
    team?: Team | null;
    name?: string | null;
    id?: string | null;
  };

  export type Team = {
    __typename?: "ChatTeam";
    id?: string | null;
  };
}
export namespace ReposInTeam {
  export type Variables = {
    offset: number;
    size: number;
  };

  export type Query = {
    __typename?: "Query";
    ChatTeam?: ChatTeam[] | null;
  };

  export type ChatTeam = {
    __typename?: "ChatTeam";
    orgs?: Orgs[] | null;
  };

  export type Orgs = {
    __typename?: "Org";
    repo?: Repo[] | null;
  };

  export type Repo = {
    __typename?: "Repo";
    name?: string | null;
    owner?: string | null;
    org?: Org | null;
  };

  export type Org = {
    __typename?: "Org";
    provider?: Provider | null;
  };

  export type Provider = {
    __typename?: "GitHubProvider";
    providerType?: ProviderType | null;
    apiUrl?: string | null;
  };
}
export namespace ScmProvider {
  export type Variables = {
    providerId: string;
  };

  export type Query = {
    __typename?: "Query";
    SCMProvider?: ScmProvider[] | null;
  };

  export type ScmProvider = {
    __typename?: "SCMProvider";
    providerType?: ProviderType | null;
    url?: string | null;
    providerId?: string | null;
    apiUrl?: string | null;
  };
}
export namespace SdmGoalsForCommit {
  export type Variables = {
    sha: string;
    branch?: string | null;
    repo: string;
    owner: string;
    providerId: string;
    goalSetId?: string | null;
    qty: number;
    offset: number;
  };

  export type Query = {
    __typename?: "Query";
    SdmGoal?: SdmGoal[] | null;
  };

  export type SdmGoal = {
    __typename?: "SdmGoal";
    id?: string | null;
    repo?: Repo | null;
  } & SdmGoalFields.Fragment;

  export type Repo = {
    __typename?: "SdmRepository";
    name?: string | null;
    owner?: string | null;
    providerId?: string | null;
  };
}
export namespace OnAnyRequestedSdmGoal {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    SdmGoal?: SdmGoal[] | null;
  };

  export type SdmGoal = {
    __typename?: "SdmGoal";
    id?: string | null;
  } & SdmGoalWithPushFields.Fragment &
    SdmGoalRepo.Fragment;
}
export namespace OnBuildComplete {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    Build?: Build[] | null;
  };

  export type Build = {
    __typename?: "Build";
    buildId?: string | null;
    buildUrl?: string | null;
    compareUrl?: string | null;
    name?: string | null;
    status?: BuildStatus | null;
    jobId?: string | null;
    startedAt?: string | null;
    timestamp?: string | null;
    push?: Push | null;
    commit?: Commit | null;
  };

  export type Push = PushFields.Fragment;

  export type Commit = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    timestamp?: string | null;
    repo?: Repo | null;
    statuses?: Statuses[] | null;
  };

  export type Repo = CoreRepoFieldsAndChannels.Fragment;

  export type Statuses = {
    __typename?: "Status";
    context?: string | null;
    description?: string | null;
    state?: StatusState | null;
    targetUrl?: string | null;
  };
}
export namespace OnClosedIssue {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    Issue?: Issue[] | null;
  };

  export type Issue = {
    __typename?: "Issue";
    number?: number | null;
    title?: string | null;
    body?: string | null;
    openedBy?: OpenedBy | null;
    closedBy?: ClosedBy | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    repo: Repo;
    assignees?: Assignees[] | null;
  };

  export type OpenedBy = {
    __typename?: "SCMId";
    login?: string | null;
    person?: Person | null;
  };

  export type Person = PersonFields.Fragment;

  export type ClosedBy = {
    __typename?: "SCMId";
    login?: string | null;
    person?: _Person | null;
  };

  export type _Person = PersonFields.Fragment;

  export type Repo = CoreRepoFieldsAndChannels.Fragment;

  export type Assignees = {
    __typename?: "SCMId";
    login?: string | null;
    person?: __Person | null;
  };

  export type __Person = PersonFields.Fragment;
}
export namespace OnIssueAction {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    Issue?: Issue[] | null;
  };

  export type Issue = {
    __typename?: "Issue";
    number?: number | null;
    title?: string | null;
    state?: IssueState | null;
    body?: string | null;
    openedBy?: OpenedBy | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    repo: Repo;
    assignees?: Assignees[] | null;
  };

  export type OpenedBy = {
    __typename?: "SCMId";
    login?: string | null;
    person?: Person | null;
  };

  export type Person = PersonFields.Fragment;

  export type Repo = CoreRepoFieldsAndChannels.Fragment;

  export type Assignees = {
    __typename?: "SCMId";
    login?: string | null;
    person?: _Person | null;
  };

  export type _Person = PersonFields.Fragment;
}
export namespace OnNewIssue {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    Issue?: Issue[] | null;
  };

  export type Issue = {
    __typename?: "Issue";
    number?: number | null;
    title?: string | null;
    state?: IssueState | null;
    body?: string | null;
    openedBy?: OpenedBy | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    repo: Repo;
    assignees?: Assignees[] | null;
  };

  export type OpenedBy = {
    __typename?: "SCMId";
    login?: string | null;
    person?: Person | null;
  };

  export type Person = PersonFields.Fragment;

  export type Repo = CoreRepoFieldsAndChannels.Fragment;

  export type Assignees = {
    __typename?: "SCMId";
    login?: string | null;
    person?: _Person | null;
  };

  export type _Person = PersonFields.Fragment;
}
export namespace OnPullRequest {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    PullRequest?: PullRequest[] | null;
  };

  export type PullRequest = {
    __typename?: "PullRequest";
    title?: string | null;
    number?: number | null;
    body?: string | null;
    id?: string | null;
    base?: Base | null;
    head?: Head | null;
    repo?: _Repo | null;
  };

  export type Base = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
  };

  export type Head = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    pushes?: Pushes[] | null;
  };

  export type Pushes = {
    __typename?: "Push";
    before?: Before | null;
    commits?: Commits[] | null;
    branch?: string | null;
    id?: string | null;
    repo?: Repo | null;
  };

  export type Before = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
  };

  export type Commits = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
  };

  export type Repo = CoreRepoFieldsAndChannels.Fragment;

  export type _Repo = CoreRepoFieldsAndChannels.Fragment;
}
export namespace OnPushToAnyBranch {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    Push?: Push[] | null;
  };

  export type Push = PushFields.Fragment;
}
export namespace OnRepoCreation {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    Repo?: Repo[] | null;
  };

  export type Repo = {
    __typename?: "Repo";
    owner?: string | null;
    name?: string | null;
    id?: string | null;
  };
}
export namespace OnSuccessStatus {
  export type Variables = {
    context: string;
  };

  export type Subscription = {
    __typename?: "Subscription";
    Status?: Status[] | null;
  };

  export type Status = {
    __typename?: "Status";
    commit?: Commit | null;
    state?: StatusState | null;
    targetUrl?: string | null;
    context?: string | null;
    description?: string | null;
  };

  export type Commit = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    statuses?: Statuses[] | null;
    repo?: Repo | null;
    pushes?: Pushes[] | null;
  };

  export type Statuses = {
    __typename?: "Status";
    context?: string | null;
    description?: string | null;
    state?: StatusState | null;
  };

  export type Repo = CoreRepoFieldsAndChannels.Fragment;

  export type Pushes = {
    __typename?: "Push";
    branch?: string | null;
  };
}
export namespace OnTag {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    Tag?: Tag[] | null;
  };

  export type Tag = {
    __typename?: "Tag";
    id?: string | null;
    name?: string | null;
    description?: string | null;
    timestamp?: string | null;
    release?: Release | null;
    commit?: Commit | null;
  };

  export type Release = {
    __typename?: "Release";
    name?: string | null;
    id?: string | null;
    timestamp?: string | null;
  };

  export type Commit = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    repo?: Repo | null;
  };

  export type Repo = CoreRepoFieldsAndChannels.Fragment;
}
export namespace OnUserJoiningChannel {
  export type Variables = {};

  export type Subscription = {
    __typename?: "Subscription";
    UserJoinedChannel?: UserJoinedChannel[] | null;
  };

  export type UserJoinedChannel = {
    __typename?: "UserJoinedChannel";
    user?: User | null;
    channel?: Channel | null;
  };

  export type User = {
    __typename?: "ChatId";
    screenName?: string | null;
    person?: Person | null;
  };

  export type Person = PersonFields.Fragment;

  export type Channel = {
    __typename?: "ChatChannel";
    name?: string | null;
    repos?: Repos[] | null;
  };

  export type Repos = CoreRepoFieldsAndChannels.Fragment;
}

export namespace CoreCommitFields {
  export type Fragment = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    timestamp?: string | null;
    committer?: Committer | null;
  };

  export type Committer = {
    __typename?: "SCMId";
    person?: Person | null;
  };

  export type Person = {
    __typename?: "Person";
    chatId?: ChatId | null;
  };

  export type ChatId = {
    __typename?: "ChatId";
    screenName?: string | null;
  };
}

export namespace CoreRepoFieldsAndChannels {
  export type Fragment = {
    __typename?: "Repo";
    owner?: string | null;
    name?: string | null;
    org?: Org | null;
    channels?: Channels[] | null;
    defaultBranch?: string | null;
  };

  export type Org = {
    __typename?: "Org";
    owner?: string | null;
    ownerType?: OwnerType | null;
    provider?: Provider | null;
  };

  export type Provider = {
    __typename?: "GitHubProvider";
    providerId?: string | null;
    providerType?: ProviderType | null;
    apiUrl?: string | null;
    url?: string | null;
  };

  export type Channels = {
    __typename?: "ChatChannel";
    team?: Team | null;
    name?: string | null;
    id?: string | null;
  };

  export type Team = {
    __typename?: "ChatTeam";
    id?: string | null;
  };
}

export namespace PersonFields {
  export type Fragment = {
    __typename?: "Person";
    forename?: string | null;
    surname?: string | null;
    name?: string | null;
    emails?: Emails[] | null;
    gitHubId?: GitHubId | null;
    chatId?: ChatId | null;
  };

  export type Emails = {
    __typename?: "Email";
    address?: string | null;
  };

  export type GitHubId = {
    __typename?: "GitHubId";
    login?: string | null;
  };

  export type ChatId = {
    __typename?: "ChatId";
    screenName?: string | null;
  };
}

export namespace PushFields {
  export type Fragment = {
    __typename?: "Push";
    id?: string | null;
    timestamp?: string | null;
    branch?: string | null;
    before?: Before | null;
    after?: After | null;
    repo?: Repo | null;
    commits?: Commits[] | null;
  };

  export type Before = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    committer?: Committer | null;
  };

  export type Committer = {
    __typename?: "SCMId";
    login?: string | null;
    person?: Person | null;
  };

  export type Person = PersonFields.Fragment;

  export type After = {
    __typename?: "Commit";
    sha?: string | null;
    message?: string | null;
    committer?: _Committer | null;
    image?: Image | null;
    tags?: Tags[] | null;
  };

  export type _Committer = {
    __typename?: "SCMId";
    login?: string | null;
    person?: _Person | null;
  };

  export type _Person = PersonFields.Fragment;

  export type Image = {
    __typename?: "DockerImage";
    image?: string | null;
    imageName?: string | null;
  };

  export type Tags = {
    __typename?: "Tag";
    name?: string | null;
    description?: string | null;
    timestamp?: string | null;
    release?: Release | null;
  };

  export type Release = {
    __typename?: "Release";
    name?: string | null;
    timestamp?: string | null;
  };

  export type Repo = CoreRepoFieldsAndChannels.Fragment;

  export type Commits = {
    __typename?: "Commit";
    sha?: string | null;
    timestamp?: string | null;
    message?: string | null;
    author?: Author | null;
  };

  export type Author = {
    __typename?: "SCMId";
    _id?: Long | null;
    login?: string | null;
    name?: string | null;
  };
}

export namespace SdmGoalFields {
  export type Fragment = {
    __typename?: "SdmGoal";
    environment?: string | null;
    uniqueName?: string | null;
    name?: string | null;
    sha?: string | null;
    branch?: string | null;
    fulfillment?: Fulfillment | null;
    description?: string | null;
    url?: string | null;
    externalUrl?: string | null;
    state?: SdmGoalState | null;
    phase?: string | null;
    externalKey?: string | null;
    goalSet?: string | null;
    goalSetId?: string | null;
    ts?: number | null;
    error?: string | null;
    retryFeasible?: boolean | null;
    preConditions?: PreConditions[] | null;
    approval?: Approval | null;
    approvalRequired?: boolean | null;
    provenance?: Provenance[] | null;
    data?: string | null;
  };

  export type Fulfillment = {
    __typename?: "SdmGoalFulfillment";
    method?: string | null;
    name?: string | null;
  };

  export type PreConditions = {
    __typename?: "SdmCondition";
    environment?: string | null;
    name?: string | null;
  };

  export type Approval = {
    __typename?: "SdmProvenance";
    correlationId?: string | null;
    registration?: string | null;
    name?: string | null;
    version?: string | null;
    ts?: number | null;
    userId?: string | null;
    channelId?: string | null;
  };

  export type Provenance = {
    __typename?: "SdmProvenance";
    correlationId?: string | null;
    registration?: string | null;
    name?: string | null;
    version?: string | null;
    ts?: number | null;
    userId?: string | null;
    channelId?: string | null;
  };
}

export namespace SdmGoalRepo {
  export type Fragment = {
    __typename?: "SdmGoal";
    repo?: Repo | null;
  };

  export type Repo = {
    __typename?: "SdmRepository";
    name?: string | null;
    owner?: string | null;
    providerId?: string | null;
  };
}

export namespace SdmGoalWithPushFields {
  export type Fragment = {
    __typename?: "SdmGoal";
    environment?: string | null;
    uniqueName?: string | null;
    name?: string | null;
    sha?: string | null;
    branch?: string | null;
    push?: Push | null;
    fulfillment?: Fulfillment | null;
    description?: string | null;
    url?: string | null;
    externalUrl?: string | null;
    state?: SdmGoalState | null;
    externalKey?: string | null;
    goalSet?: string | null;
    goalSetId?: string | null;
    ts?: number | null;
    error?: string | null;
    retryFeasible?: boolean | null;
    preConditions?: PreConditions[] | null;
    approval?: Approval | null;
    approvalRequired?: boolean | null;
    provenance?: Provenance[] | null;
    data?: string | null;
  };

  export type Push = PushFields.Fragment;

  export type Fulfillment = {
    __typename?: "SdmGoalFulfillment";
    method?: string | null;
    name?: string | null;
  };

  export type PreConditions = {
    __typename?: "SdmCondition";
    environment?: string | null;
    name?: string | null;
  };

  export type Approval = {
    __typename?: "SdmProvenance";
    correlationId?: string | null;
    registration?: string | null;
    name?: string | null;
    version?: string | null;
    ts?: number | null;
    userId?: string | null;
    channelId?: string | null;
  };

  export type Provenance = {
    __typename?: "SdmProvenance";
    correlationId?: string | null;
    registration?: string | null;
    name?: string | null;
    version?: string | null;
    ts?: number | null;
    userId?: string | null;
    channelId?: string | null;
  };
}
