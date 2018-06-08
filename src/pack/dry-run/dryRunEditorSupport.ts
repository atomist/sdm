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

import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { OnDryRunBuildComplete } from "./support/OnDryRunBuildComplete";

/**
 * Core extension pack to add dry run editing support. It's necessary to add this pack
 * to have dry run editorCommand function respond to builds.
 */
export const DryRunEditing: ExtensionPack = {
    name: "DryRunEditing",
    vendor: "Atomist",
    version: "0.1.0",
    configure: sdm => {
        sdm.addSupportingEvents(
            () => new OnDryRunBuildComplete(sdm.configuration.sdm.repoRefResolver),
        );
    },
};
