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

import { execPromise } from "@atomist/automation-client/lib/util/child_process";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { StartupListener } from "../../../../api/listener/StartupListener";
import { isInLocalMode } from "../../../internal/machine/modes";
import { kubeConfigContext } from "../kubernetes/config";

/**
 * If the SDM is running in local mode, the `DOCKER_HOST` environment
 * variable is not set, and using a minikube cluster, use `minikube
 * docker-env` to set the Docker environment variables.
 */
export const minikubeStartupListener: StartupListener = async context => {
    if (!isInLocalMode()) {
        return;
    }
    logger.debug(`Executing minikube startup listener`);

    if (process.env.DOCKER_HOST) {
        logger.info(`Using provided Docker environment variables: DOCKER_HOST=${process.env.DOCKER_HOST}`);
        return;
    }

    const configContext = kubeConfigContext(context.sdm);
    if (configContext !== "minikube") {
        logger.debug(`Context '${configContext}' is not minikube, not executing minikube startup listener`);
        return;
    }

    try {
        const result = await execPromise("minikube", ["docker-env"]);
        const envVars = processMinikubeDockeEnv(result.stdout);
        Object.keys(envVars).forEach(e => process.env[e] = envVars[e]);
        logger.info("Configured local minikube Docker environment");
    } catch (e) {
        logger.warn(`Failed to configure local minikube Docker environment: ${e.message}`);
    }
};

/**
 * Parse output of `minikube docker-env` and return an object of
 * environment variable names and values.
 *
 * @param env Raw output of `minikube docker-env`
 * @return `{ ENV_VAR1: VALUE1, ENV_VAR2: VALUE2, … }`
 */
export function processMinikubeDockeEnv(env: string): Record<string, string> {
    const dockerEnv: NodeJS.ProcessEnv = {};
    if (!env) {
        return dockerEnv;
    }
    env.split("\n").filter(l => l && !l.startsWith("#")).forEach(l => {
        const [e, v] = l.replace("export ", "").replace(/="/, "=").replace(/"$/, "").split("=");
        dockerEnv[e] = v;
    });
    return dockerEnv;
}
