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
