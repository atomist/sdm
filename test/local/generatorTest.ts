import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { SeedDrivenGeneratorParametersSupport } from "../../src/api/command/generator/SeedDrivenGeneratorParametersSupport";
import { RepositoryOwnerParentDirectory } from "../../src/local/invocation/git/machine";
import { LocalSoftwareDeliveryMachine } from "../../src/local/machine/LocalSoftwareDeliveryMachine";
import { localSoftwareDeliveryMachineOptions } from "../../src/local/machine/localSoftwareDeliveryMachineConfiguration";

describe("LocalSoftwareDeliveryMachine generator", () => {

    it("should generate", async () => {
        const repoOwnerDirectory = RepositoryOwnerParentDirectory;
        const sdm = new LocalSoftwareDeliveryMachine(
            "name",
            localSoftwareDeliveryMachineOptions(repoOwnerDirectory));
        sdm.addGenerators({
            name: "foo",
            editor: async p => p,
            paramsMaker: () => new SeedDrivenGeneratorParametersSupport({
                seed: new GitHubRepoRef("spring-team", "spring-rest-seed"),
            }),
        });
        // console.log(sdm.generatorMetadata());
        await sdm.executeCommand("foo", [
            {name: "target.owner", value: "x"},
            {name: "target.repo", value: "y"},
            {name: "github://user_token?scopes=repo,user:email,read:user", value: null},
        ]);
    }).timeout(40000);

});
