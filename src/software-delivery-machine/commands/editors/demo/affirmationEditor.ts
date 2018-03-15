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
import { commitToMaster } from "@atomist/automation-client/operations/edit/editModes";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { editorCommand, EmptyParameters } from "../../../../handlers/commands/editors/editorCommand";
import { OptionalBranchParameters } from "../support/OptionalBranchParameters";

/**
 * Function returning a command handler around the appendAffirmationToReadMe
 * editor
 * @type {HandleCommand<EditOneOrAllParameters>}
 */
export const affirmationEditor: HandleCommand = editorCommand(
    () => appendAffirmationToReadMe,
    "affirmation",
    EmptyParameters,
    {
        editMode: commitToMaster("Everyone needs encouragement sometimes"),
    },
);

export const branchAffirmationEditor: HandleCommand = editorCommand(
    () => appendAffirmationToReadMe,
    "branch affirmation",
    OptionalBranchParameters,
    {
        // Be sure to create a new instance each time to ensure unique branch names
        editMode: bap => ({
            message: `Everyone needs encouragement to write Java`,
            branch: bap.branch || "ja-" + new Date().getTime(),
        }),
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

export const appendAffirmationToReadMe: SimpleProjectEditor = async (p, ctx) => {
    const affirmation = randomAffirmation();
    await ctx.messageClient.respond(`Adding to \`README.md\`: _${affirmation}_`);
    return doWithFiles(p, "README.md", async f => {
        const content = await f.getContent();
        return f.setContent(`${content}\n${affirmation}\n`);
    });
};
