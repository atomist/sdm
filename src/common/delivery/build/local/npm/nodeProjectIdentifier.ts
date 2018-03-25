import { ProjectIdentifier } from "../projectIdentifier";

export const NodeProjectIdentifier: ProjectIdentifier = async p => {
    const pkg = await p.getFile("package.json");
    if (!pkg) {
        return undefined;
    }
    const parsed = JSON.parse(await pkg.getContent());
    return { name: parsed.name };
};
