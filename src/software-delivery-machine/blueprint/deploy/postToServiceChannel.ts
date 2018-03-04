import { DeploymentListener } from "../../../common/listener/DeploymentListener";

export const PostToServiceChannel: DeploymentListener =
    inv => {
        return inv.addressChannels(`Oh frabjous day! I was successfully deployed!`);
    };
