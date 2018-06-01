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

import { Function1 } from "lodash";
import { RepoContext, SdmContext } from "../context/SdmContext";

export type ListenerInvocation = SdmContext;

/**
 * Common parameters to an invocation of a listener to one of the
 * SDM's specific events. These are fired by our event handlers to allow
 * multiple, domain specific, listeners to be invoked.
 */
export type RepoListenerInvocation = RepoContext;

export type RepoListener<I extends RepoListenerInvocation = RepoListenerInvocation, R extends any = any> =
    Function1<I, Promise<R>>;

/**
 * Mapper from a ListenerInvocation to any result
 */
export type SdmListener<I extends ListenerInvocation, R extends any = any> =
    Function1<I, Promise<R>>;
