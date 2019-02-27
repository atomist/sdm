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

/**
 * Use this to wrap types that describe additions to the SDM configuration.
 * Then you can add this to your type declaration for `configuration` in index.ts,
 * so that you get autocompletion, and errors if you supply the wrong type. Like:
 *
 * `const configuration: Configuration & AdditionalSdmConfiguration<SdmCacheConfiguration>`
 */
export interface AdditionalSdmConfiguration<ConfigurationType> {
    sdm: ConfigurationType;
}

/**
 * Configure a directory where files can be cached.
 * This directory is cleaned on SDM startup; files older than 2 hours are removed.
 */
export interface SdmCacheConfiguration {

    cache: {
        enabled: boolean;
        /**
         * Directory defaults to /opt/data
         */
        path?: string;
    };
}
