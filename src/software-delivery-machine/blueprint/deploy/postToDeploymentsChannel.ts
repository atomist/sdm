
import { OnDeployStatus } from "../../../handlers/events/delivery/deploy/OnDeployStatus";

export const PostToDeploymentsChannel = () => new OnDeployStatus([
    (id, status, ac, ctx) => {
        return ctx.messageClient.addressChannels(`Successful deployment of \`${id.owner}/${id.repo}:${id.sha}\``, "deployments");
    }],
);
