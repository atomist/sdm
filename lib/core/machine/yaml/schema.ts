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

import { Parameterized } from "../../../api/goal/GoalWithFulfillment";

export const AtomistYamlFileName = "atomist.yaml";

export interface AtomistYaml {

    skill: {
        namespace?: string; // defaults to owner name
        name: string; // defaults to repo name

        title: string;
        displayName: string; // as alternative to title

        version: string; // defaults to 0.1.0

        description: string; // short one sentence description of the skill

        documentation: string; // longish description that provides detailed documentation
        longDescription: string; // as alternative to documentation

        category: string[];
        technology: string[];
        author: string;
        license: string;
        homepage: string;
        repository: string;
        icon: string;

        package: PackageUse | PackageUse[];

        runtime: {
            timeout: number;
            memory: 128 | 256 | 512 | 1024 | 2048;
            entryPoint: string;
            name: "nodejs10" | "python37" | "go113";
        }
    };

    commands?: Array<{
        name: string;
        description: string;
        pattern: string;
    }>;

    subscriptions?: string[];
    ingesters?: string[];

    rules?: any;
    goals?: any;
}

export interface PackageUse extends Parameterized {
    use: string;
}
