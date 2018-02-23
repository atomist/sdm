import { DeployListener } from "../../../handlers/events/delivery/deploy/OnDeployStatus";

export const PostToDeploymentsChannel: DeployListener =
    (id, status, ac, ctx) => {
        return ctx.messageClient.addressChannels(`Successful deployment of \`${id.owner}/${id.repo}:${id.sha}\``, "deployments");
    };

export const PostToServiceChannel: DeployListener =
    (id, status, ac, ctx) => {
        return ac(`Whoopee! I was successful deployed!`);
    };
