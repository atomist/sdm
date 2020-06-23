/*
 * Copyright © 2019 Atomist, Inc.
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

import { ProgressTest, testProgressReporter } from "../../../../api-helper/goal/progress/progress";
import { ReportProgress } from "../../../../api/goal/progress/ReportProgress";

/**
 * Default progress tests for our Docker builds
 * @type {{test: RegExp; phase: string}[]}
 */
export const DockerProgressTests: ProgressTest[] = [
    {
        test: /Invoking goal hook: pre/i,
        phase: "pre-hook",
    },
    {
        test: /docker 'build'/i,
        phase: "docker build",
    },
    {
        test: /docker 'push'/i,
        phase: "docker push",
    },
    {
        test: /Invoking goal hook: post/i,
        phase: "post-hook",
    },
    {
        test: /\/kaniko\/executor/i,
        phase: "kaniko build",
    },
    {
        test: /pushed blob sha256/i,
        phase: "kaniko push",
    },
];

/**
 * Default ReportProgress for our Docker
 */
export const DockerProgressReporter: ReportProgress = testProgressReporter(...DockerProgressTests);
