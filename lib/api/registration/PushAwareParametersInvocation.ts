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

import { ProgressLog } from "../../spi/log/ProgressLog";
import { ParametersInvocation } from "../listener/ParametersInvocation";
import { PushImpactListenerInvocation } from "../listener/PushImpactListener";

/**
 * Code inspections or autofixes may be invoked in response to a push,
 * or just with Parameters
 */
export interface PushAwareParametersInvocation<P> extends ParametersInvocation<P> {

    /**
     * The push invocation. Will be undefined if we are not invoked from a push.
     */
    push?: PushImpactListenerInvocation;

    /**
     * Optional ProgressLog to log to
     */
    progressLog?: ProgressLog;
}
