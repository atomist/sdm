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

import { HandleCommand } from "@atomist/automation-client";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { AllJavaFiles } from "@atomist/spring-automation/commands/generator/java/javaProjectUtils";
import { editorCommand } from "../../../../common/command/editor/editorCommand";
import { AffirmationParameters } from "./affirmationEditor";

/**
 * Harmlessly modify a Java file on master
 * @type {HandleCommand<EditOneOrAllParameters>}
 */
export const javaAffirmationEditor: HandleCommand = editorCommand(
    () => appendAffirmationToJava,
    "javaAffirmation",
    () => new AffirmationParameters("Everyone needs encouragement to write Java"),
    {
        editMode: ap => ap.editMode,
        intent: "javakick",
    },
);

const affirmations = [
    "You're good enough, you're smart enough, and doggone it, people like you.",
    "I believe in you. You can do the thing!",
    "You are the delta in what you do, not the things you did in the past",
    "It’s only a thought, and a thought can be changed.",
    "As I say yes to life, life says yes to me.",
    "Deep at the center of my being is an infinite well of love.",
    "I come from the loving space of my heart, and I know that love opens all doors.",
];

function randomAffirmation() {
    return affirmations[getRandomInt(affirmations.length)];
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

export const appendAffirmationToJava: SimpleProjectEditor<AffirmationParameters> = (p, ctx, params) => {
    const affirmation = params.customAffirmation || randomAffirmation();
    let count = 0;
    return doWithFiles(p, AllJavaFiles, f => {
        return f.getContent().then(async content => {
            if (count++ >= 1) {
                return;
            }
            await ctx.messageClient.respond(`Prepending to \`${f.name}\` via \`${params.branchToUse}\`: _${affirmation}_`);
            return f.setContent(`// ${affirmation}\n\n${content}`);
        });
    });
};
