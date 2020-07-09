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

import { Project } from "@atomist/automation-client/lib/project/Project";
import * as os from "os";

export async function determineMavenCommand(p: Project): Promise<string> {
    if (os.platform() === "win32") {
        if (process.env.JAVA_HOME && (await p.hasFile("mvnw.cmd"))) {
            return "mvnw";
        } else {
            return "mvn";
        }
    } else if (await p.hasFile("mvnw")) {
        // Some times people end up storing the mvnw script in Git without executable flag; fix it
        await p.makeExecutable("mvnw");
        return "./mvnw";
    } else {
        return "mvn";
    }
}
