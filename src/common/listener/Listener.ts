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

import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Function1 } from "lodash";
import { OnPushToAnyBranch } from "../../typings/types";
import { SdmContext } from "../context/SdmContext";

/**
 * Common parameters to an invocation of a listener to one of the
 * SDM's specific events. These are fired by our event handlers to allow
 * multiple, domain specific, listeners to be invoked.
 */
export type ListenerInvocation = SdmContext;

export type SdmListener<I extends ListenerInvocation = ListenerInvocation, R extends any = any> =
    Function1<I, Promise<R>>;

/**
 * Invocation for an event relating to a project for which we have source code.
 * Many event listeners listen to this type of event.
 */
export interface ProjectListenerInvocation extends ListenerInvocation {

    /**
     * The project to which this event relates. It will have been cloned
     * prior to this invocation. Modifications made during listener invocation will
     * not be committed back to the project (although they are acceptable if necessary, for
     * example to run particular commands against the project).
     * As well as working with
     * project files using the Project superinterface, we can use git-related
     * functionality fro the GitProject subinterface: For example to check
     * for previous shas.
     * We can also easily run shell commands against the project using its baseDir.
     */
    project: GitProject;

    readonly push: OnPushToAnyBranch.Push;

}

export type ProjectListener = SdmListener<ProjectListenerInvocation>;
