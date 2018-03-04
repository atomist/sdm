import { DeploymentListener } from "../../../common/listener/DeploymentListener";

export const PostToDeploymentsChannel: DeploymentListener =
    inv => {
        return inv.context.messageClient.addressChannels(`Successful deployment of \`${inv.id.owner}/${inv.id.repo}:${inv.id.sha}\``, "deployments");
    };
