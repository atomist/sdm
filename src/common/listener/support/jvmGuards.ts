import { SpringBootProjectStructure } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectStructure";
import { listChangedFiles } from "../../../software-delivery-machine/blueprint/review/listChangedFiles";
import { GoalSetterInvocation, PushTest } from "../GoalSetter";

export const IsMaven: PushTest = (pi: GoalSetterInvocation) =>
    pi.project.findFile("pom.xml")
        .then(() => true, () => false);

export const IsSpringBoot: PushTest = (pi: GoalSetterInvocation) =>
    SpringBootProjectStructure.inferFromJavaSource(pi.project)
        .then(springBootStructure => !!springBootStructure);
