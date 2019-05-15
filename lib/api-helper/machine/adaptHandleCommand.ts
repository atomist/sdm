import { Maker } from "@atomist/automation-client";
import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { metadataFromInstance } from "@atomist/automation-client/lib/internal/metadata/metadataReading";
import { CommandHandlerMetadata } from "@atomist/automation-client/lib/metadata/automationMetadata";
import { toFactory } from "@atomist/automation-client/lib/util/constructionUtils";
import * as _ from "lodash";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";

/**
 * Convert an decorator-style HandleCommand to a SDM-style CommandHandlerRegistration
 */
export function adaptHandleCommand(maker: Maker<HandleCommand<any>>): CommandHandlerRegistration {
    const md = metadataFromInstance(toFactory(maker)()) as CommandHandlerMetadata;

    return {
        name: md.name,
        intent: md.intent,
        description: md.description,
        tags: (md.tags || []).map(t => t.name),
        autoSubmit: md.auto_submit,
        paramsMaker: maker,
        listener: async ci => {
            const h = toFactory(maker)() as HandleCommand;
            _.forEach(ci.parameters, (v, k) => h[k] = v);
            return h.handle(ci.context, ci.parameters);
        },
    };
}
