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

import { logger } from "@atomist/automation-client/lib/util/logger";
import * as k8s from "@kubernetes/client-node";
import { errMsg } from "../support/error";
import { logRetry } from "../support/retry";
import {
    K8sObjectApi,
    K8sObjectResponse,
} from "./api";
import { loadKubeConfig } from "./config";
import { logObject } from "./resource";
import { specSlug } from "./spec";

/**
 * Create or replace a Kubernetes resource using the provided spec.
 * This implementation uses read, patch, and create, but may switch to
 * [server-side
 * apply](https://github.com/kubernetes/enhancements/issues/555) when
 * it is available.
 *
 * @param spec Kubernetes resource spec sufficient to identify and create the resource
 * @return response from the Kubernetes API.
 */
export async function applySpec(spec: k8s.KubernetesObject): Promise<K8sObjectResponse> {
    const slug = specSlug(spec);
    let client: K8sObjectApi;
    try {
        const kc = loadKubeConfig();
        client = kc.makeApiClient(K8sObjectApi);
    } catch (e) {
        e.message = `Failed to create Kubernetes client: ${errMsg(e)}`;
        throw e;
    }
    try {
        await client.read(spec);
    } catch (e) {
        logger.debug(`Failed to read resource ${slug}: ${errMsg(e)}`);
        logger.info(`Creating resource ${slug} using '${logObject(spec)}'`);
        return logRetry(() => client.create(spec), `create resource ${slug}`);
    }
    logger.info(`Patching resource ${slug} using '${logObject(spec)}'`);
    const options = {
        headers: {
            "Content-Type": "application/merge-patch+json",
        },
    };
    return logRetry(() => client.patch(spec, options), `patch resource ${slug}`);
}
