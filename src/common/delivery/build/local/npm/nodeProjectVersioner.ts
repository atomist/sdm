import * as df from "dateformat";
import { spawnAndWatch } from "../../../../../util/misc/spawned";
import { ProjectVersioner } from "../projectVersioner";

export const NodeProjectVersioner: ProjectVersioner = async (p, log) => {
    const pjFile = await p.getFile("package.json");
    const pj = JSON.parse(await pjFile.getContent());
    const version = `${pj.version}-${df(new Date(), "yyyymmddHHMMss")}`;

    const result = await spawnAndWatch({
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

    return result;
};
