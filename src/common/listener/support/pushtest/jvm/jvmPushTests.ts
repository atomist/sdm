/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { fileExists } from "@atomist/automation-client/project/util/projectUtils";
import { AllJavaFiles } from "@atomist/spring-automation/commands/generator/java/javaProjectUtils";
import { SpringBootProjectStructure } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectStructure";
import { PushTest, pushTest, PushTestInvocation } from "../../../PushTest";

/**
 * Is this a Maven project
 * @param {PushTestInvocation} pi
 * @constructor
 */
export const IsMaven: PushTest = pushTest("Is Maven", async (pi: PushTestInvocation) =>
    !!(await pi.project.getFile("pom.xml")));

export const IsJava: PushTest = pushTest("Is Java", async (pi: PushTestInvocation) =>
    await fileExists(pi.project, AllJavaFiles, () => true));

/**
 * Does this project have a Spring Boot application class?
 * This is a robust but expensive test as it needs
 * to scan all Java sources
 * @param {PushTestInvocation} pi
 * @constructor
 */
export const HasSpringBootApplicationClass = pushTest(
    "Has Spring Boot @Application class",
    async pi => !!(await SpringBootProjectStructure.inferFromJavaSource(pi.project)));
