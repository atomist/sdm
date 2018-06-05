import { RepoFinder } from "@atomist/automation-client/operations/common/repoFinder";
import * as fs from "fs";
import * as _ from "lodash";
import { FileSystemRemoteRepoRef } from "./FileSystemRemoteRepoRef";
import { logger } from "@atomist/automation-client";

export function expandedDirectoryRepoFinder(repositoryOwnerParentDirectory: string): RepoFinder {
    return async () => {
        const eligibleDirectories: string[] =
            _.flatten(fs.readdirSync(repositoryOwnerParentDirectory)
                .map(org => {
                    logger.info("Reading under child directory [%s] under %s", org, repositoryOwnerParentDirectory);
                    return fs.readdirSync(`${repositoryOwnerParentDirectory}/${org}`)
                        .map(repo => `${repositoryOwnerParentDirectory}/${org}/${repo}`)
                        .filter(repo => fs.existsSync(`${repo}/.git`));
                }),
            );
        return eligibleDirectories.map(dir =>
            FileSystemRemoteRepoRef.fromDirectory(repositoryOwnerParentDirectory,
                dir, "master", undefined));
    };
}
