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

import { ReportProgress } from "../../../api/goal/progress/ReportProgress";

/**
 * Simple test to map between a RegExp and a phase.
 */
export interface ProgressTest {
    test: RegExp;
    phase: string;
}

/**
 * ReportProgress implementation that uses RexExp tests to extract progess
 * @param {ProgressTest} tests
 * @returns {ReportProgress}
 */
export function testProgressReporter(...tests: ProgressTest[]): ReportProgress {
    return log => {
        // TODO CD we could add match groups and markers in the label
        const match = tests.find(t => t.test.test(log));
        if (match) {
            return { phase: match.phase };
        }
        return {};
    };
}
