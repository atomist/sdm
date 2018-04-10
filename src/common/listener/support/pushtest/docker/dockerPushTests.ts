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

import { predicatePushTest, PredicatePushTest } from "../../../PushTest";
import { hasFile } from "../commonPushTests";

/**
<<<<<<< HEAD
 * Does this project have a Dockerfile
 */
export const HasDockerFile: PredicatePushTest = predicatePushTest(
    "Has Dockerfile",
=======
 * Does this project have a Docker file
 */
export const HasDockerFile: PredicatePushTest = predicatePushTest(
    "Has Docker File",
>>>>>>> Docker bits and pieces
    hasFile("Dockerfile").predicate);
