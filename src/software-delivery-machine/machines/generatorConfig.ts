/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Customize to change generator behavior everywhere
 * @type {{seedOwner: string; addAtomistWebhook: boolean}}
 */
export const CommonGeneratorConfig = {
    seedOwner: "spring-team",
    addAtomistWebhook: true,
};

/**
 * Customize to change Java generator behavior everywhere
 * @type {{groupId: string}}
 */
export const CommonJavaGeneratorConfig = {
    ...CommonGeneratorConfig,
    groupId: "atomist",
};
