
import { OnDeployStatus } from "../../handlers/events/delivery/OnDeployStatus";

export const NotifyOnDeploy = new OnDeployStatus(
    (id, status, ctx) => {
        console.log("**************** notifyOnDeploy was called");
        return ctx.messageClient.addressChannels(`Successful deployment of \`${id.owner}/${id.repo}:${id.sha}\``, "deployments");
    },
);
