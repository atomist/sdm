import { RepositoryOwnerParentDirectory } from "../../src/local/invocation/machine";
import { LocalSoftwareDeliveryMachine } from "../../src/local/machine/LocalSoftwareDeliveryMachine";
import { localSoftwareDeliveryMachineOptions } from "../../src/local/machine/localSoftwareDeliveryMachineConfiguration";

describe("LocalSoftwareDeliveryMachine editor", () => {

    it("should edit", async () => {
        const repoOwnerDirectory = RepositoryOwnerParentDirectory;
        const sdm = new LocalSoftwareDeliveryMachine(
            "name",
            localSoftwareDeliveryMachineOptions(repoOwnerDirectory));
        sdm.addEditors({
            name: "ed1",
            editor: async p => p.addFile("thing", "1"),
        });
        await sdm.executeCommand("ed1", [
            {name: "target.repos", value: ".*"},
        ]);
    }).timeout(40000);

});
