import * as findUp from "find-up";
import * as path from "path";
import * as trace from "stack-trace";
import { ExtensionPackMetadata } from "../..";

/**
 * Read ExtensionPackMetadata from the modules package.json.
 * @param {string} name
 * @returns {ExtensionPackMetadata}
 */
export function metadata(name?: string): ExtensionPackMetadata {
    const pathToCallingFunction = trace.get()[1].getFileName();
    const pj = findUp.sync("package.json", { cwd: path.resolve(path.dirname(pathToCallingFunction)) });

    return {
        name: name ? `${pj.name}-${name.toLocaleLowerCase()}` : pj.name,
        vendor: pj.author,
        version: pj.version,
    }
}