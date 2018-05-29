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

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as schema from "../../typings/types";
import { ListenerInvocation, SdmListener } from "./Listener";

export interface UserJoiningChannelListenerInvocation extends ListenerInvocation {

    joinEvent: schema.OnUserJoiningChannel.UserJoinedChannel;

    /**
     * Any linked repo refs
     */
    repos: RemoteRepoRef[];
}

/**
 * Respond to a user joining a channel
 */
export type UserJoiningChannelListener = SdmListener<UserJoiningChannelListenerInvocation>;
