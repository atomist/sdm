import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { AddressChannels } from "../../common/slack/addressChannels";
import { InterpretedLog } from "../../spi/log/InterpretedLog";
import { ProgressLog } from "../../spi/log/ProgressLog";

export async function reportFailureInterpretation(stepName: string,
                                                  interpretation: InterpretedLog,
                                                  fullLog: { url?: string, log: string },
                                                  id: RemoteRepoRef,
                                                  ac: AddressChannels,
                                                  retryButton?: slack.Action) {
    await ac({
        text: `Failed ${stepName} of ${slack.url(`${id.url}/tree/${id.sha}`, id.sha.substr(0, 6))}`,
        attachments: [{
            title: interpretation.message || "Failure",
            title_link: fullLog.url,
            fallback: "relevant bits",
            text: interpretation.relevantPart,
            color: "#ff5050",
            actions: retryButton ? [retryButton] : [],
        }],
    });
    if (interpretation.includeFullLog) {
        await ac({
            content: fullLog.log,
            fileType: "text",
            fileName: `deploy-failure-${id.sha}.log`,
        } as any);
    }
}
