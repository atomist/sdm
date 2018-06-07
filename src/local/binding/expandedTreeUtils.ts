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

export function withinExpandedTree(repositoryOwnerParentDirectory, baseDir: string): boolean {
    const {owner, repo} = parseOwnerAndRepo(repositoryOwnerParentDirectory, baseDir);
    return !!owner && !!repo;
}
