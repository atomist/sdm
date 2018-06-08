import { HandlerContext } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AddressChannels } from "../../../../api/context/addressChannels";

import * as assert from "power-assert";

export function messageClientAddressChannels(id: RemoteRepoRef, ctx: HandlerContext): AddressChannels {
    assert(!!ctx, "Context must be provided");
    return async (msg, opts) => {
        return ctx.messageClient.addressChannels(msg, id.repo, opts);
    };
}
