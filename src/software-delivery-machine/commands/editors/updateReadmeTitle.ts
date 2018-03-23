/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { doWithFileMatches } from "@atomist/automation-client/project/util/parseUtils";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";

import { RestOfLine } from "@atomist/microgrammar/matchers/skip/Skip";

export function updateReadmeTitle(appName: string,
                                  description: string) {
    return project => {
        return doWithFileMatches(project, "README.md", h1Grammar, fm => {
            if (fm.matches.length > 0) {
                fm.matches[0].value = appName + "\n\n" + description;
            }
        });
    };
}

const headingGrammar: (start: string) => Microgrammar<{ value: string }> = start => Microgrammar.fromDefinitions({
    _start: start,
    value: RestOfLine,
});

const h1Grammar = headingGrammar("#");
