
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
