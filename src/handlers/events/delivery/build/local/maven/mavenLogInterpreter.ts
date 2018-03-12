import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { Float } from "@atomist/microgrammar/primitives";
import {
    InterpretedLog,
    LogInterpreter,
} from "../../../../../../spi/log/InterpretedLog";

// TODO base on common build info
export interface MavenInfo {

    timeMillis?: number;
}

export type MavenInterpretedLog = InterpretedLog<MavenInfo>;

export const interpretMavenLog: LogInterpreter<MavenInfo> = log => {
    const relevantPart = log.split("\n")
        .filter(l => l.startsWith("[ERROR]"))
        .join("\n");
    const mg = Microgrammar.fromString<{seconds: number}>("Total time: ${seconds} s", {
        seconds: Float,
    });
    const timing = mg.firstMatch(log);
    return {
        relevantPart,
        message: "Maven log",
        includeFullLog: true,
        data: {
            timeMillis: !!timing ? timing.seconds * 1000 : undefined,
        },
    };
};
