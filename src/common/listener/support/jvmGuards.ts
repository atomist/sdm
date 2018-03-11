import { SpringBootProjectStructure } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectStructure";
import { listChangedFiles } from "../../../software-delivery-machine/blueprint/review/listChangedFiles";
import { PushTest, PushTestInvocation } from "../GoalSetter";

export const IsMaven: PushTest = (pi: PushTestInvocation) =>
    pi.project.findFile("pom.xml")
        .then(() => true, () => false);

export const IsSpringBoot: PushTest = (pi: PushTestInvocation) =>
    SpringBootProjectStructure.inferFromJavaSource(pi.project)
        .then(springBootStructure => !!springBootStructure);
