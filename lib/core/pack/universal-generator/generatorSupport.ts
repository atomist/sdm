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

import { Project } from "@atomist/automation-client/lib/project/Project";
import { metadata } from "../../../api-helper/misc/extensionPack";
import { ExtensionPack } from "../../../api/machine/ExtensionPack";
import { CodeTransform } from "../../../api/registration/CodeTransform";
import { GeneratorRegistration } from "../../../api/registration/GeneratorRegistration";
import { ParametersObject } from "../../../api/registration/ParametersDefinition";
import { toArray } from "../../util/misc/array";
import { universalGenerator } from "./generator";

/**
 * Registration for CodeTransform, ParametersObject and an additional test
 */
export interface UniversalTransform<PARAMS = any> {
    /** Return true if provided CodeTransforms should be executed against Project p */
    test?: (p: Project) => Promise<boolean>;
    /** CodeTransforms to execute */
    transforms: CodeTransform<PARAMS> | Array<CodeTransform<PARAMS>>;
    /** Additional parameters the CodeTransforms need */
    parameters?: ParametersObject<PARAMS>;
}

/**
 * Configuration options for the universalGeneratorSupport extension pack
 */
export interface UniversalGeneratorSupportOptions {
    /** Generators to enrich with additional CodeTransforms */
    generators: GeneratorRegistration<any> | Array<GeneratorRegistration<any>>;
    /** Additional CodeTransforms, their parameters and optional project test */
    transformsAndParameters?: UniversalTransform<any> | Array<UniversalTransform<any>>;
}

/**
 * Configure generators in the form GeneratorRegistrations to run additional CodeTransforms
 *
 * The CodeTransforms are getting registered with an optional test which can be used to
 * interrogate the seed project and determine if the CodeTransform should be executed
 * against the seed.
 * CodeTransforms can also register parameter definitions to ask for more parameters via a
 * promptFor question flow.
 */
export function universalGeneratorSupport(options: UniversalGeneratorSupportOptions): ExtensionPack {
    return {
        ...metadata(),
        configure: sdm => {
            toArray(options.generators)
                .map(g => universalGenerator<any>(sdm, g, toArray(options.transformsAndParameters || [])))
                .forEach(g => sdm.addGeneratorCommand(g));
        },
    };
}
