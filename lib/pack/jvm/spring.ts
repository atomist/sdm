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

/**
 * Categories of functionality to enable
 */
export interface Categories {
    cloudNative?: boolean;

    springStyle?: boolean;
}

/**
 * Options determining what Spring functionality is activated.
 */
export interface SpringSupportOptions {
    desiredSpringBootVersion: string;

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
     * Whether to apply spring-format automatically, if an autofixGoal is provided
     */
    springFormat?: boolean;

    /**
     * Review listeners that let you publish review results.
     */
    reviewListeners?: ReviewListenerRegistration | ReviewListenerRegistration[];
}

/**
 * Extension pack offering Spring Boot support.
 * Adds Spring Boot related commands and automatic repo tagging
 * on the first push we see. Use options to determine whether
 * reviews and autofixes run.
 */
export function springSupport(options: SpringSupportOptions): ExtensionPack {
    return {
        ...metadata(),
        configure: sdm => {
            if (!!options.inspectGoal) {
                if (options.reviewListeners) {
                    const listeners = Array.isArray(options.reviewListeners)
                        ? options.reviewListeners
                        : [options.reviewListeners];
                    listeners.forEach(l => options.inspectGoal.withListener(l));
                }
            }
        },
    };
}
