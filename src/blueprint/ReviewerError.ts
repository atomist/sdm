import * as slack from "@atomist/slack-messages/SlackMessages";

export class ReviewerError extends Error {
    constructor(public reviewerName: string, msg: string, public stderr: string) {
        super(msg);
    }
}

export function formatReviewerError(err: ReviewerError): slack.SlackMessage {
    // I'd like to include a reference to the commit here
    const attachment:slack.Attachment = {
        color: "#bd4024",
        fallback: err.message,
        text: err.message,
        title: err.reviewerName + " failed to run",
    };

    return { attachments: [attachment]}
}