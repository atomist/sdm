/*
 * Copyright © 2020 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import { Project } from "@atomist/automation-client/lib/project/Project";

export const javaSource = `package com.smashing.pumpkins;

@SpringBootApplication
class GishApplication {
    //1
}

`;

export const kotlinSource = `package com.smashing.pumpkins

@SpringBootApplication
class GishApplication {
}

`;

const SimplePom = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>flux-flix-service</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>flux-flix-service</name>
    <description>Demo project for Spring Boot</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.0.0.BUILD-SNAPSHOT</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
</project>
`;

export const GishJavaPath = "src/main/java/com/smashing/pumpkins/Gish.java";

export const GishProject: () => Project = () =>
    InMemoryProject.from(
        { owner: "smashing-pumpkins", repo: "gish", url: "" },
        {
            path: GishJavaPath,
            content: javaSource,
        },
        {
            path: "pom.xml",
            content: SimplePom,
        },
    );

export const GishProjectWithLambda: () => Project = () =>
    InMemoryProject.from(
        { owner: "smashing-pumpkins", repo: "gish", url: "" },
        {
            path: GishJavaPath,
            content: javaSource.replace(
                "//1",
                `NumericTest isEven = (n) -> (n % 2) == 0;
	NumericTest isNegative = (n) -> (n < 0);`,
            ),
        },
        {
            path: "pom.xml",
            content: SimplePom,
        },
    );

export const GishProjectWithLocalTypeInference: () => Project = () =>
    InMemoryProject.from(
        { owner: "smashing-pumpkins", repo: "gish", url: "" },
        {
            path: GishJavaPath,
            content: javaSource.replace("//1", "var x = new HashMap<String,Integer>();"),
        },
        {
            path: "pom.xml",
            content: SimplePom,
        },
    );

export const GishProjectWithComment: () => Project = () =>
    InMemoryProject.from(
        { owner: "smashing-pumpkins", repo: "gish", url: "" },
        {
            path: GishJavaPath,
            content: javaSource.replace("@SpringBootApplication", "@SpringBootApplication // ha ha trying to fool you"),
        },
        {
            path: "pom.xml",
            content: SimplePom,
        },
    );

export const GishKotlinPath = "src/main/kotlin/com/smashing/pumpkins/Gish.kt";

export const KotlinGishProject: () => Project = () =>
    InMemoryProject.from(
        { owner: "smashing-pumpkins", repo: "gish", url: "" },
        {
            path: GishKotlinPath,
            content: kotlinSource,
        },
        {
            path: "pom.xml",
            content: SimplePom,
        },
    );

export const ProblemProject: () => Project = () =>
    InMemoryProject.from(
        { owner: "smashing-pumpkins", repo: "gish", url: "" },
        {
            path: "src/main/java/com/av/AardvarkApplication.java",
            content: ProblemFile1,
        },
        {
            path: "pom.xml",
            content: SimplePom,
        },
    );

const ProblemFile1 = `
package com.av;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AardvarkApplication {

	public static void main(String[] args) {
		SpringApplication.run
	}
}
`;
