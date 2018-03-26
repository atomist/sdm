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

import { AtomistK8sSpecFile } from "../../../../../software-delivery-machine/commands/editors/k8s/addK8sSpec";
import { PredicatePushTest, predicatePushTest } from "../../../PushTest";

export const HasK8Spec: PredicatePushTest = predicatePushTest(
    "Has K8Spec",
        async p => !!(await p.getFile(AtomistK8sSpecFile)),
);
