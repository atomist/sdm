/*
 * Copyright © 2020 Atomist, Inc.
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

import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import * as fs from "fs-extra";
import * as lc from "license-checker";
import * as _ from "lodash";
import * as path from "path";
import * as spdx from "spdx-license-list";
import { promisify } from "util";
import { StringCapturingProgressLog } from "../../../api-helper/log/StringCapturingProgressLog";
import { spawnLog } from "../../../api-helper/misc/child_process";
import { PushTest } from "../../../api/mapping/PushTest";
import { ToDefaultBranch } from "../../../api/mapping/support/commonPushTests";
import { allSatisfied } from "../../../api/mapping/support/pushTestUtils";
import { AutofixRegistration } from "../../../api/registration/AutofixRegistration";
import { CodeTransform } from "../../../api/registration/CodeTransform";
import { IsNode } from "../pushtest/nodePushTests";

const LicenseMapping: Record<string, string> = {
    "Apache 2.0": "Apache-2.0",
};

const LicenseFileName = "legal/THIRD_PARTY.md";
const GitattributesFileName = ".gitattributes";

const LicenseTableHeader = `| Name | Version | Publisher | Repository |
|------|---------|-----------|------------|`;

const SummaryTableHadler = `| License | Count |
|---------|-------|`;

export const AddThirdPartyLicenseAutofix = addThirdPartyLicense(allSatisfied(IsNode, ToDefaultBranch));

export function addThirdPartyLicense(pushTest: PushTest): AutofixRegistration {
    return {
        name: "Third party licenses",
        pushTest,
        transform: addThirdPartyLicenseTransform(),
    };
}

export function addThirdPartyLicenseTransform(): CodeTransform<NoParameters> {
    return async p => {
        const cwd = (p as GitProject).baseDir;

        const pj = JSON.parse((await fs.readFile(path.join(cwd, "package.json"))).toString());
        const ownModule = `${pj.name}@${pj.version}`;

        if (!(await p.hasDirectory("node_modules"))) {
            const result = await spawnLog("npm", ["ci"], {
                cwd,
                log: new StringCapturingProgressLog(),
            });
            if (result && result.code !== 0) {
                return p;
            }
        }

        const json = await promisify(lc.init)({
            start: cwd,
            production: true,
        });

        const grouped: Record<string, lc.ModuleInfo[]> = {};
        _.forEach(json, (v, k) => {
            if (k === ownModule) {
                return;
            }

            let licenses = v.licenses;

            if (!Array.isArray(licenses)) {
                if (licenses.endsWith("*")) {
                    licenses = licenses.slice(0, -1);
                }

                if (licenses.startsWith("(") && licenses.endsWith(")")) {
                    licenses = licenses.slice(1, -1);
                }
                licenses = [...licenses.split(" OR ")];
            }

            licenses.forEach(l => {
                let license = l;

                if (LicenseMapping.hasOwnProperty(license)) {
                    license = LicenseMapping[license];
                }

                if (grouped.hasOwnProperty(license)) {
                    grouped[license] = [
                        ...grouped[license],
                        {
                            ...v,
                            name: k,
                        },
                    ];
                } else {
                    grouped[license] = [
                        {
                            ...v,
                            name: k,
                        },
                    ];
                }
            });
        });

        const summary = [];
        const counts = _.mapValues(grouped, l => (l as any).length);
        for (const l in counts) {
            if (counts.hasOwnProperty(l)) {
                const anchor = l
                    .toLocaleLowerCase()
                    .replace(/ /g, "-")
                    .replace(/\./g, "")
                    .replace(/:/g, "")
                    .replace(/\//g, "");
                summary.push(`|[${l}](#${anchor})|${counts[l]}|`);
            }
        }

        const details: string[] = [];
        // tslint:disable-next-line:no-inferred-empty-object-type
        _.forEach(grouped, (v, k) => {
            const deps = v.map(dep => {
                const ix = dep.name.lastIndexOf("@");
                const name = dep.name.slice(0, ix);
                const version = dep.name.slice(ix + 1);
                return `|\`${name}\`|\`${version}\`|${dep.publisher ? dep.publisher : ""}|${
                    dep.repository ? `[${dep.repository}](${dep.repository})` : ""
                }|`;
            });
            let ld = "";

            if (spdx[k]) {
                ld = `${spdx[k].name} - [${spdx[k].url}](${spdx[k].url})\n`;
            }

            details.push(`
#### ${k}
${ld}
${LicenseTableHeader}
${deps.join("\n")}`);
        });

        const lic = spdx[pj.license]
            ? `

\`${pj.name}\` is licensed under ${spdx[pj.license].name} - [${spdx[pj.license].url}](${spdx[pj.license].url}).`
            : "";
        const content = `# \`${pj.name}\`${lic}

This page details all runtime OSS dependencies of \`${pj.name}\`.

## Licenses

### Summary

${SummaryTableHadler}
${summary.sort((s1, s2) => s1.localeCompare(s2)).join("\n")}
${details.sort((s1, s2) => s1.localeCompare(s2)).join("\n")}

## Contact

Please send any questions or inquires to [oss@atomist.com](mailto:oss@atomist.com).

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack team][slack].

[atomist]: https://atomist.com/ (Atomist - Development Automation)
[slack]: https://join.atomist.com/ (Atomist Community Slack)
`;

        await addGitattribute(p);
        await p.deleteDirectory("node_modules");
        await p.addFile(LicenseFileName, content);

        return p;
    };
}

async function addGitattribute(p: Project): Promise<void> {
    const attribute = `${LicenseFileName} linguist-generated=true
`;
    const ga = await p.getFile(GitattributesFileName);
    if (ga) {
        let c = await ga.getContent();
        if (!c.includes(LicenseFileName)) {
            c += `
${attribute}`;
            await ga.setContent(c);
        }
    } else {
        await p.addFile(GitattributesFileName, attribute);
    }
}
