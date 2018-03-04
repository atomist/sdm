
import { SpringBootProjectStructure } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectStructure";
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
    const springBootStructure = await SpringBootProjectStructure.inferFromJavaSource(pi.project);
    return !!springBootStructure;
};
