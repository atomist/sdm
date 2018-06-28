import { OnEvent } from "@atomist/automation-client/onEvent";
import { Maker } from "@atomist/automation-client/util/constructionUtils";

/**
 * Type for registering event handlers.
 */
export interface EventHandlerRegistration<EVENT = any, PARAMS = any> {

    /**
     * Name of the event handler.
     */
    name: string;

    /**
     * Optional description of the event handler.
     */
    description?: string;

    /**
     * Optional tags of the event handler.
     */
    tags?: string | string[];

    /**
     * GraphQL subscription to subscribe this listener to.
     * Note: Use subscription() methods of automation-client to create the subscription string
     */
    subscription: string;

    /**
     * Create the parameters required by this command.
     * Empty parameters will be returned by default.
     */
    paramsMaker?: Maker<PARAMS>;

    /**
     * Listener to receive subscription matches.
     */
    listener: OnEvent<EVENT>;
}
