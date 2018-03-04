import { SpringBootProjectStructure } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectStructure";
import { PhaseCreationInvocation, PushTest } from "../PhaseCreator";
import { listChangedFiles } from "../../../software-delivery-machine/blueprint/review/listChangedFiles";

export const IsMaven: PushTest = (pi: PhaseCreationInvocation) =>
    pi.project.findFile("pom.xml")
        .then(() => true, () => false);

export const IsSpringBoot: PushTest = (pi: PhaseCreationInvocation) =>
    SpringBootProjectStructure.inferFromJavaSource(pi.project)
        .then(springBootStructure => !!springBootStructure);