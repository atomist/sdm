/*
 * Copyright © 2018 Atomist, Inc.
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

import { metadata } from "../../api-helper/misc/extensionPack";
import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { CodeTransformRegistrationDecorator } from "../../api/registration/CodeTransformRegistration";
import { dryRunBuildListener } from "./support/DryRunBuildListener";
import { dryRunDecorator, DryRunOptions } from "./support/dryRunDecorator";

export { DryRunOptions } from "./support/dryRunDecorator";

export interface DryRunExtensionPack extends ExtensionPack {

    dryRun: CodeTransformRegistrationDecorator<any>;
}

/**
 * Core extension pack to add dry run editing support. It's necessary to add this pack
 * to have dry run editorCommand function respond to builds.
 */
export function dryRunCodeTransforms(opts: Partial<DryRunOptions> = {}): DryRunExtensionPack {
    const optsToUse: DryRunOptions = {
        ...opts,
        issueRouter: undefined,
    };

    return {
        ...metadata("dry-run-editing"),
        configure: sdm => {
            sdm.addBuildListener(dryRunBuildListener(optsToUse));
        },
        dryRun: dryRunDecorator(optsToUse),
    };
}
