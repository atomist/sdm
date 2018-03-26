import { HandlerContext } from "@atomist/automation-client";

export function fakeContext(teamId: string = "T123") {
    return {
        teamId,
        messageClient: {
            respond() {
                return undefined;
            },
        },
    } as any as HandlerContext;
}