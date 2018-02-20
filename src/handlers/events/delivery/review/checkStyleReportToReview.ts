import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectReview, ReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { CheckstyleReport, FileReport } from "./CheckstyleReport";

import * as _ from "lodash";

export function checkstyleReportToReview(repoId: RepoRef,
                                         cr: CheckstyleReport,
                                         baseDir: string): ProjectReview {
    return {
        repoId,
        comments: _.flatten(cr.files.map(f => fileComments(f, baseDir))),
    };
}

function fileComments(file: FileReport, baseDir: string): ReviewComment[] {
    return file.errors.map(e => ({
        category: "checkstyle",
        severity: e.severity,
        detail: e.message,
        sourceLocation: {
            path: file.name.replace(baseDir, ""),
            lineFrom1: e.line > 0 ? e.line : 0,
            offset: -1,
        },
    }));
}
