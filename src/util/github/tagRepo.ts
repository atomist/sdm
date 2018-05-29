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

import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Tagger } from "@atomist/automation-client/operations/tagger/Tagger";
import { PushListener } from "../../api/listener/PushListener";
import { publishTags } from "../../internal/repo/publishTags";

/**
 * Tag the repo using the given tagger
 * @param {Tagger} tagger
 */
export function tagRepo(tagger: Tagger): PushListener {
    return async pInv =>
        isGitHubRepoRef(pInv.id) ?
            publishTags(tagger, pInv.id, pInv.credentials, pInv.addressChannels, pInv.context) :
            true;
}
