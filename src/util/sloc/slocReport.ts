/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Project } from "@atomist/automation-client/project/Project";

import { File } from "@atomist/automation-client/project/File";
import { saveFromFilesAsync } from "@atomist/automation-client/project/util/projectUtils";
import * as _ from "lodash";
import * as sloc from "sloc";
import { AllLanguages } from "./languages";

export interface Language {
    name: string;
    extensions: string[];
}

export interface CodeStats {
    language: Language;
    total: number;
    source: number;
    comment: number;
    single: number;
    block: number;
}

export interface FileReport {

    stats: CodeStats;

    file: File;

}

/**
 * Report about a project's files in a given language
 */
export class LanguageReport {

    constructor(public language: Language, public fileReports: FileReport[]) {
    }

    /**
     * Return stats for each language
     * @return {CodeStats[]}
     */
    get stats(): CodeStats {
        return {
            language: this.language,
            total: _.sum(this.fileReports.map(r => r.stats.total)),
            source: _.sum(this.fileReports.map(r => r.stats.source)),
            comment: _.sum(this.fileReports.map(r => r.stats.comment)),
            single: _.sum(this.fileReports.map(r => r.stats.single)),
            block: _.sum(this.fileReports.map(r => r.stats.block)),
        };
    }

}

/**
 * Report about lines of code in various languages.
 */
export class LanguagesReport {

    constructor(public languageReports: LanguageReport[]) {
    }

    get languagesScanned(): Language[] {
        return _.uniq(this.languageReports.map(lr => lr.language));
    }

    /**
     * Return only the found languages
     * @return {CodeStats[]}
     */
    get relevantLanguageReports(): LanguageReport[] {
        return this.languageReports.filter(lr => lr.stats.total > 0);
    }

}

export interface LanguageReportRequest {

    language: Language;

    /**
     * Narrow down search--eg to exclude test
     */
    glob?: string;
}

/**
 * Use the sloc library to compute code statistics
 * @param {Project} p
 * @param {string} request
 * @return {Promise<LanguageReport>}
 */
export async function reportForLanguage(p: Project, request: LanguageReportRequest): Promise<LanguageReport> {
    if (request.language.extensions.length > 1) {
        throw new Error("Only one extension supported in " + JSON.stringify(request.language));
    }
    const extension = request.language.extensions[0];
    const globToUse = request.glob || `**/*.${extension}`;
    const fileReports = await saveFromFilesAsync<FileReport>(p, globToUse, async f => {
        const content = await f.getContent();
        const stats = sloc(content, extension);
        return {
            stats,
            file: f,
            language: request.language,
        };
    });
    return new LanguageReport(request.language, fileReports);
}

export async function reportForLanguages(p: Project,
                                         requests: LanguageReportRequest[] = AllLanguages.map(language => ({language}))): Promise<LanguagesReport> {
    const languageReports = await Promise.all(requests.map(r => reportForLanguage(p, r)));
    return new LanguagesReport(languageReports);
}
