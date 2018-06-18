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

import * as df from "dateformat";
import { branchFromCommit } from "../../../../../api-helper/goal/executeBuild";
import { spawnAndWatch } from "../../../../../api-helper/misc/spawned";
import { ProjectVersioner } from "../projectVersioner";

export const NodeProjectVersioner: ProjectVersioner = async (status, p, log) => {
    const pjFile = await p.getFile("package.json");
    const pj = JSON.parse(await pjFile.getContent());
    const branch = branchFromCommit(status.commit).split("/").join(".");
    const branchSuffix = branch !== status.commit.repo.defaultBranch ? `${branch}.` : "";
    const version = `${pj.version}-${branchSuffix}${df(new Date(), "yyyymmddHHMMss")}`;

    await spawnAndWatch({
            command: "npm",
            args: ["--no-git-tag-version", "version", version],
        },
        {
            cwd: p.baseDir,
        },
        log,
        {
            errorFinder: code => code !== 0,
        });

    return version;
};
