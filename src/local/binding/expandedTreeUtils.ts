export function parseOwnerAndRepo(repositoryOwnerParentDirectory, baseDir: string): { owner?: string, repo?: string } {
    // TODO support symlinks
    if (!baseDir.startsWith(repositoryOwnerParentDirectory)) {
        return {};
    }
    const ourPart = baseDir.replace(repositoryOwnerParentDirectory, "");
    const pattern = /\/(.*)\/(.*)/;
    const match = ourPart.match(pattern);
    return !!match && match.length >= 2 ?
        {owner: match[1], repo: match[2]} :
        {};
}

/**
 * Is the given directory within the expanded directory tree?
 * @param repositoryOwnerParentDirectory
 * @param {string} baseDir directory to test
 * @return {boolean}
 */
export function withinExpandedTree(repositoryOwnerParentDirectory: string, baseDir: string): boolean {
    const {owner, repo} = parseOwnerAndRepo(repositoryOwnerParentDirectory, baseDir);
    return !!owner && !!repo;
}
