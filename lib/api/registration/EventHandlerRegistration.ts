/*
 * Copyright © 2019 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { OnEvent } from "@atomist/automation-client/lib/onEvent";
import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import { Maker } from "@atomist/automation-client/lib/util/constructionUtils";
import { ParametersDefinition } from "./ParametersDefinition";

/**
 * Type for registering event handlers.
 */
export interface EventHandlerRegistration<EVENT = any, PARAMS = NoParameters> {

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
     * Note: Use GraphQL.subscription() methods of automation-client to create the subscription string
     */
    subscription: string;

    /**
     * Create the parameters required by this command.
     * Empty parameters will be returned by default.
     * @deprecated use parameters
     */
    paramsMaker?: Maker<PARAMS>;

    /**
     * Define parameters used by this command. Alternative to using
     * paramsMaker: Do not supply both.
     */
    parameters?: ParametersDefinition<PARAMS>;

    /**
     * Listener to receive subscription matches.
     */
    listener: OnEvent<EVENT, PARAMS>;
}
