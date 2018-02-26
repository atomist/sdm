import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectReview, ReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { CheckstyleReport, FileReport } from "./CheckstyleReport";

import { logger } from "@atomist/automation-client";
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
    // This is a bit complex but necessary as we can get some content before baseDir
    const path = file.name.substr(file.name.indexOf(baseDir) + baseDir.length);
    logger.info("Processing file comments for [%s], baseDir=[%s], path=[%s]", file.name, baseDir, path);
    return file.errors.map(e => ({
        category: "checkstyle",
        severity: e.severity,
        detail: e.message,
        sourceLocation: {
            path,
            lineFrom1: e.line > 0 ? e.line : 0,
            offset: -1,
        },
    }));
}
