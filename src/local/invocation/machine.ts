import { configure } from "../configure";
import { LocalSoftwareDeliveryMachine } from "../machine/LocalSoftwareDeliveryMachine";
import { localSoftwareDeliveryMachineOptions } from "../machine/localSoftwareDeliveryMachineConfiguration";

export const RepositoryOwnerParentDirectory = process.env.LOCAL_SDM_BASE || "/Users/rodjohnson/temp/local-sdm";

export const sdm = new LocalSoftwareDeliveryMachine(
    "gitMachine",
    localSoftwareDeliveryMachineOptions(RepositoryOwnerParentDirectory));

configure(sdm);
