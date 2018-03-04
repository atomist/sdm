import "mocha";

import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import {
    CustomSpringBootGeneratorParameters,
} from "../../../src/software-delivery-machine/commands/generators/spring/CustomSpringBootGeneratorParameters";
import {
    setAtomistTeamInApplicationYml,
    updateReadme,
} from "../../../src/software-delivery-machine/commands/generators/spring/springBootGenerator";

const Readme1 = `# spring-rest-seed

This project contains an Atomist seed project.

## Development

This project is driven using [Maven][mvn].

[mvn]: https://maven.apache.org/`;

const yml1  = `logging:
   level:
     com.atomist.spring.agent: DEBUG

atomist:
  enabled: true
  debug: true
  url: 'https://webhook.atomist.com/atomist/application/teams/\${ATOMIST_TEAM}'
  environment:
      domain: '\${vcap.application.space_name:development}'
      pod: '\${HOSTNAME:\${random.value}}'`;

describe("custom Spring Boot generator", () => {

    describe("update README", () => {

        it("should get correct content", async () => {
                const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
                    {path: "README.md", content: Readme1});
                const params = new CustomSpringBootGeneratorParameters({
                    seedOwner: "foo",
                    seedRepo: "bar",
                });
                params.target.repo = "repoName";
                params.serviceClassName = "foo";
                params.bindAndValidate();
                await updateReadme(params)(p);
                const readmeContent = p.findFileSync("README.md").getContentSync();
                console.log(readmeContent);
                assert(readmeContent.includes("# repoName"), "Should include repo name");
                assert(readmeContent.includes("seed project \`foo:bar"));
            });
    });

    describe("update YML", () => {

        it("should put in Atomist team id", async () => {
            const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
                {path: "src/main/resources/application.yml", content: yml1});
            const ctx = { teamId: "T1000"};
            await setAtomistTeamInApplicationYml(undefined, ctx)(p);
            const yml = p.findFileSync("src/main/resources/application.yml").getContentSync();
            console.log(yml);
            assert(yml.includes("/teams/T1000"), "Should include Atomist team");
        });
    });

});
