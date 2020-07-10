/*
 * Copyright © 2020 Atomist, Inc.
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
import { AutoCodeInspection } from "../../api/goal/common/AutoCodeInspection";
import { Autofix } from "../../api/goal/common/Autofix";
import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { ReviewListenerRegistration } from "../../api/registration/ReviewListenerRegistration";
import { AddBuildScript } from "./autofix/addBuildScript";
import { TslintAutofix } from "./autofix/typescript/tslintAutofix";

export interface NodeConfiguration {
    npm?: {
        publish?: {
            /**
             * Defaults to true! Provide false explicitly to disable
             */
            enabled?: boolean;
            access?: "public" | "restricted";
            tag?: {
                /**
                 * When creating a version name, we usually include the name of the branch unless it's the default branch.
                 * Should we include the name of the branch even when it's the default branch?
                 *
                 * If this is true, the version will look like 1.0.0-master.yyyymmddHHMMss
                 * If this is false, the version on the default branch will look like 1.0.0-yyyymmddHHMMss
                 */
                defaultBranch?: boolean;
            };
        };
    };
}

/**
 * Categories of functionality to enable
 */
export interface Categories {
    typescriptErrors?: boolean;
}

/**
 * Options determining what Node functionality is activated.
 */
export interface NodeSupportOptions {
    /**
     * Inspect goal to add inspections to.
     * Review functionality won't work otherwise.
     */
    inspectGoal?: AutoCodeInspection;

    /**
     * Autofix goal to add autofixes to.
     * Autofix functionality won't work otherwise.
     */
    autofixGoal?: Autofix;

    review: Categories;

    autofix: Categories;

    /**
     * Review listeners that let you publish review results.
     */
    reviewListeners?: ReviewListenerRegistration | ReviewListenerRegistration[];
}

/**
 * Install node support into your SDM.
 * @param options
 */
export function nodeSupport(options: NodeSupportOptions): ExtensionPack {
    return {
        ...metadata(),
        configure: () => {
            if (!!options.inspectGoal) {
                if (options.reviewListeners) {
                    const listeners = Array.isArray(options.reviewListeners)
                        ? options.reviewListeners
                        : [options.reviewListeners];
                    listeners.forEach(l => options.inspectGoal.withListener(l));
                }
            }
            if (!!options.autofixGoal) {
                if (options.autofix.typescriptErrors) {
                    options.autofixGoal.with(TslintAutofix).with(AddBuildScript);
                }
            }
        },
    };
}
