import { SpringBootProjectStructure } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectStructure";
import { PushTest, PushTestInvocation } from "../GoalSetter";

/**
 * Is this a Maven project
 * @param {PushTestInvocation} pi
 * @constructor
 */
export const IsMaven: PushTest = async (pi: PushTestInvocation) =>
    !!(await pi.project.getFile("pom.xml"));

/**
 * Does this project have a Spring Boot application class?
 * This is a robust but expensive test as it needs
 * to scan all Java sources
 * @param {PushTestInvocation} pi
 * @constructor
 */
export const HasSpringBootApplicationClass: PushTest = (pi: PushTestInvocation) =>
    SpringBootProjectStructure.inferFromJavaSource(pi.project)
        .then(springBootStructure => !!springBootStructure);
