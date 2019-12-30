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

import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { metadataFromInstance } from "@atomist/automation-client/lib/internal/metadata/metadataReading";
import { CommandHandlerMetadata } from "@atomist/automation-client/lib/metadata/automationMetadata";
import {
    Maker,
    toFactory,
} from "@atomist/automation-client/lib/util/constructionUtils";
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
            const h = toFactory(maker)();
            _.forEach(ci.parameters, (v, k) => h[k] = v);
            return h.handle(ci.context, ci.parameters);
        },
    };
}
