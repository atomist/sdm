import { ListenerInvocation, SdmListener } from "../../../common/listener/Listener";

/**
 * Send a message to the #general channel in the current
 * Slack team on creation of a new repo
 * @param {ListenerInvocation} i
 * @return {Promise<any>}
 */
export const PublishNewRepo: SdmListener = (i: ListenerInvocation) => {
    return i.context.messageClient.addressChannels(
        `A new repo was created: \`${i.id.owner}:${i.id.repo}\``, "general");
};
