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

import { SpringBootProjectStructure } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectStructure";
import { predicatePushTest, PredicatePushTest } from "../../../PushTest";

/**
 * Does this project have a Spring Boot application class?
 * This is a robust but expensive test as it needs
 * to scan all Java sources
 */
export const HasSpringBootApplicationClass: PredicatePushTest = predicatePushTest(
    "Has Spring Boot @Application class",
    async p => await HasSpringBootPom.predicate(p) && !!(await SpringBootProjectStructure.inferFromJavaSource(p)));

export const HasSpringBootPom: PredicatePushTest = predicatePushTest(
    "Has Spring Boot POM",
    async p => {
        const pom = await p.getFile("pom.xml");
        if (!pom) {
            return false;
        }
        return (await pom.getContent()).includes("spring-boot");
    },
);
