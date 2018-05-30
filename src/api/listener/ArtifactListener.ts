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

import { DeployableArtifact } from "../../spi/artifact/ArtifactStore";
import { PushRegistration } from "../registration/PushRegistration";
import { RepoListenerInvocation, SdmListener } from "./Listener";

export interface ArtifactListenerInvocation extends RepoListenerInvocation {

    deployableArtifact: DeployableArtifact;

}

export type ArtifactListener = SdmListener<ArtifactListenerInvocation>;

export type ArtifactListenerRegistration = PushRegistration<ArtifactListener>;

export type ArtifactListenerRegisterable = ArtifactListener | ArtifactListenerRegistration;

export function toArtifactListenerRegistration(alr: ArtifactListenerRegisterable): ArtifactListenerRegistration {
    return isArtifactListenerRegistration(alr) ?
        alr :
        {
            name: "auto",
            action: alr,
        };
}

function isArtifactListenerRegistration(a: ArtifactListenerRegisterable): a is ArtifactListenerRegistration {
    const maybeAlr = a as ArtifactListenerRegistration;
    return !!maybeAlr.action && !!maybeAlr.name;
}
