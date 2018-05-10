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

import { SourceRepoParameters } from "@atomist/automation-client/operations/common/params/SourceRepoParameters";
import { NewRepoCreationParameters } from "@atomist/automation-client/operations/generate/NewRepoCreationParameters";

/**
 * The parameters needed to create a new repo from a seed.
 */
export interface SeedDrivenGeneratorParameters {

    addAtomistWebhook: boolean;

    source: SourceRepoParameters;

    target: NewRepoCreationParameters;

}
