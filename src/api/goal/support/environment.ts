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

export type GoalEnvironment = "0-code/" | "1-staging/" | "2-prod/" | "8-doom/";

export const IndependentOfEnvironment: GoalEnvironment = "0-code/";

export const StagingEnvironment: GoalEnvironment = "1-staging/";
// should always be number dash name. The number may be a decimal
export const ProductionEnvironment: GoalEnvironment = "2-prod/";
export const ProjectDisposalEnvironment: GoalEnvironment = "8-doom/";
