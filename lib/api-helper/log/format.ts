import { sprintf } from "sprintf-js";

/**
 * Returns a formatted string replacing any placeholders in msg with
 * provided args
 *
 * See npm springf-js for more details on what args and placeholder
 * patterns are supported.
 */
export function format(msg: string, ...args: any[]): string {
    const fmsg = sprintf(msg, ...args);
    return fmsg;
}
