import { DeploymentListener } from "../../../handlers/events/delivery/deploy/DeploymentListener";

export const PostToDeploymentsChannel: DeploymentListener =
    inv => {
        return inv.context.messageClient.addressChannels(`Successful deployment of \`${inv.id.owner}/${inv.id.repo}:${inv.id.sha}\``, "deployments");
    };

export const PostToServiceChannel: DeploymentListener =
    inv => {
        return inv.addressChannels(`Whoopee! I was successfully deployed!`);
    };
