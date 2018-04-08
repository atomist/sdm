import { InterpretedLog, LogInterpreter } from "../../../../spi/log/InterpretedLog";

export function lastTenLinesLogInterpreter(message: string): LogInterpreter {
    return (log: string): InterpretedLog => {
        return {
            relevantPart: log.split("\n").slice(-10).join("\n"),
            message,
            includeFullLog: true,
        };
    };
}

/**
 * Use when we don't want to report the log to the user under
 * any circumstances
 * @param {string} log
 * @return {InterpretedLog}
 * @constructor
 */
export const LogSuppressor: LogInterpreter = (log: string): InterpretedLog => {
    return {
        relevantPart: "",
        message: "Do not report to user",
        includeFullLog: false,
        doNotReportToUser: true,
    };
};
