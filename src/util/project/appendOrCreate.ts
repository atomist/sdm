import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";

export interface AppendOrCreateCommand {

    /**
     * Path of file to create or append to
     */
    path: string;

    /**
     * Content to append. Should include any whitespace
     * required before it
     */
    toAppend: string;

    /**
     * Custom test as to whether we should create
     * @param {string} content
     * @return {boolean}
     */
    leaveAlone?: (oldContent: string) => boolean;
}

/**
 * Return an editor to append the given content to the end of the file at the specified path,
 * creating the file with only this content if it doesn't exist.
 * Adds no whitespace.
 * @param command command
 * @return {SimpleProjectEditor}
 */
export function appendOrCreateFileContent(command: AppendOrCreateCommand): SimpleProjectEditor {
    const commandToUse: AppendOrCreateCommand = {
        leaveAlone: content => content.includes(command.toAppend),
        ...command,
    };
    return async p => {
        const target = await p.getFile(commandToUse.path);
        if (!!target) {
            const oldContent = await target.getContent();
            if (!commandToUse.leaveAlone(oldContent)) {
                await target.setContent(oldContent + commandToUse.toAppend);
            }
        } else {
            await p.addFile(commandToUse.path, commandToUse.toAppend);
        }
        return p;
    };
}
