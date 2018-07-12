import { ReportProgress } from "../../../api/goal/progress/ReportProgress";

interface ProgressTest {
    test: RegExp;
    label: string;
}

export function testProgressReporter(...tests: ProgressTest[]): ReportProgress {
    return log => {
        const match = tests.find(t => t.test.test(log));
        if (match) {
            return { message: match.label };
        }
        return {};
    };
}