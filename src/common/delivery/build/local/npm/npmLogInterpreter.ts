import { LogInterpreter } from "../../../../../spi/log/InterpretedLog";

export const NpmLogInterpreter: LogInterpreter = log => {
    if (!log) {
        return undefined;
    }
    const relevantPart = log.split("\n")
        .filter(l => l.startsWith("ERROR") || l.includes("ERR!"))
        .map(l => l.replace(/^npm ERROR /, "")
            .replace(/^npm ERR! /, ""))
        .join("\n");
    return {
        relevantPart,
        message: "npm errors",
        includeFullLog: true,
    };
};
