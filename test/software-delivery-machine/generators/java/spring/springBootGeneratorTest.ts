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

import { HandlerContext } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { Project } from "@atomist/automation-client/project/Project";
import * as assert from "power-assert";
import {
    replaceReadmeTitle, setAtomistTeamInApplicationYml,
    springBootGenerator,
} from "../../../../../src/software-delivery-machine/commands/generators/java/spring/springBootGenerator";
import {
    SpringProjectCreationParameters,
} from "../../../../../src/software-delivery-machine/commands/generators/java/spring/SpringProjectCreationParameters";

const Readme1 = `# spring-rest-seed

This project contains an Atomist seed project.

## Development

This project is driven using [Maven][mvn].

[mvn]: https://maven.apache.org/`;

const yml1 = `logging:
   level:
     com.atomist.spring.agent: DEBUG

atomist:
  enabled: true
  debug: true
  url: 'https://webhook.atomist.com/atomist/application/teams/\${ATOMIST_TEAM}'
  environment:
      domain: '\${vcap.application.space_name:development}'
      pod: '\${HOSTNAME:\${random.value}}'`;

describe("springBootGenerator", () => {

    describe("update README", () => {

        it("should get correct content", async () => {
            const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
                {path: "README.md", content: Readme1});
            const params = new SpringProjectCreationParameters({
                seedOwner: "foo",
                seedRepo: "bar",
                intent: "whatever",
                groupId: "atomist",
                addAtomistWebhook: false,
            });
            params.target.repo = "repoName";
            params.serviceClassName = "foo";
            params.bindAndValidate();
            await replaceReadmeTitle(params)(p);
            const readmeContent = p.findFileSync("README.md").getContentSync();
            assert(readmeContent.includes("# repoName"), "Should include repo name");
            assert(readmeContent.includes("seed project \`foo:bar"));
        });
    });

    describe("update YML", () => {

        it("should put in Atomist team id", async () => {
            const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
                {path: "src/main/resources/application.yml", content: yml1});
            const ctx = {teamId: "T1000"};
            await setAtomistTeamInApplicationYml(undefined, ctx)(p);
            const yml = p.findFileSync("src/main/resources/application.yml").getContentSync();
            assert(yml.includes("/teams/T1000"), "Should include Atomist team");
        });
    });

    describe("run end to end", () => {

        it("should put in Atomist team id and ensure valid Java", async () => {
            const config = {
                seedOwner: "spring-team",
                seedRepo: "spring-rest-seed",
                intent: "whatever",
                groupId: "atomist",
                addAtomistWebhook: false,
            };
            let result: Project;
            const gen = springBootGenerator(config, {
                repoLoader: () => () => GitCommandGitProject.cloned({token: null},
                    new GitHubRepoRef(config.seedOwner, config.seedRepo)),
                projectPersister: async p => {
                    result = p;
                    return {target: p, success: true};
                },
            });

            const ctx = {
                teamId: "T1000",
                messageClient: {
                    respond() {
                        return Promise.resolve();
                    },
                },
                graphClient: {
                    query() {
                        return Promise.resolve(false);
                    },
                },
            } as any as HandlerContext;
            const params = new SpringProjectCreationParameters(config);
            params.artifactId = "artifact";
            params.rootPackage = "atomist.test";
            params.target.owner = "whoever";
            params.target.repo = "whatever";
            params.bindAndValidate();
            await gen.handle(ctx, params);

            const yml = result.findFileSync("src/main/resources/application.yml").getContentSync();
            assert(yml.includes("/teams/T1000"), "Should include Atomist team");
            result.findFileSync("src/main/java/atomist/test/ArtifactApplication.java").getContentSync();
        }).timeout(18000);
    });

});
