import { DefaultRepoRefResolver } from "../../handlers/common/DefaultRepoRefResolver";
import { RepoRefResolver } from "../../spi/repo-ref/RepoRefResolver";

export function defaultRepoRefResolver(): RepoRefResolver {
    return new DefaultRepoRefResolver();
}