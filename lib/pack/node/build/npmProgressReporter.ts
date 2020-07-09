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

import { ProgressTest, testProgressReporter } from "../../../api-helper/goal/progress/progress";
import { ReportProgress } from "../../../api/goal/progress/ReportProgress";

/**
 * Default progress tests for our NPM-based builds
 * @type {{test: RegExp; phase: string}[]}
 */
export const NpmProgressTests: ProgressTest[] = [
    {
        test: /Invoking goal hook: pre/i,
        phase: "pre-hook",
    },
    {
        test: /> atm-git-info/i,
        phase: "git-info",
    },
    {
        test: /> atm-gql-gen/i,
        phase: "gql-gen",
    },
    {
        test: /> tsc --project \./i,
        phase: "tsc",
    },
    {
        test: /> nyc mocha/i,
        phase: "mocha",
    },
    {
        test: /> mocha --exit/i,
        phase: "mocha",
    },
    {
        test: /> mocha --require/i,
        phase: "mocha",
    },
    {
        test: /Sending build context to Docker daemon/i,
        phase: "docker build",
    },
    {
        test: /The push refers to .* repository/i, // This used to have 'a repository'; now it is without it.
        phase: "docker push",
    },
    {
        test: /Invoking goal hook: post/i,
        phase: "post-hook",
    },
    {
        test: /> npm 'publish'/i,
        phase: "npm publish",
    },
    {
        test: /> tslint/i,
        phase: "TslintAutofix",
    },
    {
        test: /> typedoc/i,
        phase: "typedoc",
    },
    {
        test: /> npm 'run' '([\S]*)'/i,
        phase: "npm $1",
    },
];

/**
 * Default ReportProgress for our NPM-based builds
 */
export const NpmProgressReporter: ReportProgress = testProgressReporter(...NpmProgressTests);
