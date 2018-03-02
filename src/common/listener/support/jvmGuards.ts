
import { PushTest } from "../PhaseCreator";

export const IsMaven: PushTest = async pi => {
    try {
        await pi.project.findFile("pom.xml");
        return true;
    } catch {
        return false;
    }
};

export const IsSpringBoot: PushTest = async pi => {
    try {
        const f = await pi.project.findFile("pom.xml");
        const contents = await f.getContent();
        return contents.includes("spring-boot");
    } catch {
        return false;
    }
};
