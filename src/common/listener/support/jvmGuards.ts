import { SpringBootProjectStructure } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectStructure";
import { PushTest } from "../PhaseCreator";

export const IsMaven: PushTest = pi =>
    pi.project.findFile("pom.xml")
        .then(() => true, () => false);

export const IsSpringBoot: PushTest = async pi => {
    const springBootStructure = await SpringBootProjectStructure.inferFromJavaSource(pi.project);
    return !!springBootStructure;
};
