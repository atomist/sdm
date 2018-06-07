import { configure } from "../configure";
import { LocalSoftwareDeliveryMachine } from "../machine/LocalSoftwareDeliveryMachine";
import { localSoftwareDeliveryMachineOptions } from "../machine/localSoftwareDeliveryMachineConfiguration";

export const RepositoryOwnerParentDirectory = process.env.SDM_PROJECTS_ROOT || "/Users/rodjohnson/temp/local-sdm";

export const sdm = new LocalSoftwareDeliveryMachine(
    "gitMachine",
    localSoftwareDeliveryMachineOptions(RepositoryOwnerParentDirectory));

configure(sdm);
