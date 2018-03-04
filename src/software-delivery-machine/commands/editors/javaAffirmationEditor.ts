import { HandleCommand } from "@atomist/automation-client";
import { commitToMaster } from "@atomist/automation-client/operations/edit/editModes";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { AllJavaFiles } from "@atomist/spring-automation/commands/generator/java/javaProjectUtils";
import { editor } from "../../../handlers/commands/editors/registerEditor";

/**
 * Harmlessly modify a Java file on master
 * @type {HandleCommand<EditOneOrAllParameters>}
 */
export const javaAffirmationEditor: HandleCommand<any> = editor(
    () => appendAffirmationToJava,
    "java affirmation",
    {
        editMode: commitToMaster(`Everyone needs encouragement to write Java`),
    },
);

/**
 * Harmlessly modify a Java file on a branch
 * @type {HandleCommand<EditOneOrAllParameters>}
 */
export const javaBranchAffirmationEditor: HandleCommand<any> = editor(
    () => appendAffirmationToJava,
    "java branch affirmation",
    {
        // Be sure to create a new instance each time to ensure unique branch names
        editMode: () => ({
            message: `Everyone needs encouragement to write Java`,
            branch: "ja-" + new Date().getTime(),
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

export const appendAffirmationToJava: SimpleProjectEditor = (p, ctx) => {
    const affirmation = randomAffirmation();
    let count = 0;
    return doWithFiles(p, AllJavaFiles, f => {
        f.getContent().then(async content => {
            if (count++ >= 1) {
                return;
            }
            await ctx.messageClient.respond(`Prepending to \`${f.name}\`: _${affirmation}_`);
            return f.setContent(`// ${affirmation}\n\n${content}`);
        });
    });
};
