
export interface InterpretedLog {

    /**
     * Relevant part of log to display in UX, if we were able to identify it
     */
    relevantPart: string;

    message: string;

    /**
     * Should the UX include the full log, or is it too long or ugly?
     */
    includeFullLog?: boolean;
}

export type LogInterpreter = (log: string) => InterpretedLog | undefined;

/**
 * Implemented by types that have the ability to interpret the logs they generate
 */
export interface LogInterpretation {

    logInterpreter?: LogInterpreter;
}

export function hasLogInterpretation(b: any): b is LogInterpretation {
    return b.logInterpreter && typeof b.logInterpreter === "function";
}
