
/**
 * Run the given function, catching any exceptions and writing the error
 * message to the console without the stack trace.
 * @param {() => Promise<any>} what
 * @return {Promise<void>}
 */
export async function logExceptionsToConsole(what: () => Promise<any>) {
    try {
        await what();
    } catch (err) {
        // TODO log the actual exception to a log file
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}