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
import * as _ from "lodash";
import {
    decrypt,
    encrypt,
} from "../support/crypto";
import { errMsg } from "../support/error";
import { logRetry } from "../support/retry";
import { applicationLabels } from "./labels";
import { metadataTemplate } from "./metadata";
import { patchHeaders } from "./patch";
import {
    appName,
    KubernetesApplication,
    KubernetesResourceRequest,
    KubernetesSdm,
} from "./request";
import { logObject } from "./resource";

/**
 * Create application secrets if they do not exist.  If a secret in
 * `req.secrets` exists, the secret is patched.  The provided secrets
 * are merged through [[secretTemplate]] before creating/patching.  If
 * `req.secrets` is false or any empty array, no secrets are modified.
 *
 * @param req Kuberenetes application request
 * @return Array of secret specs created/patched, which array may be empty
 */
export async function upsertSecrets(req: KubernetesResourceRequest): Promise<k8s.V1Secret[]> {
    const slug = appName(req);
    if (!req.secrets || req.secrets.length < 1) {
        logger.debug(`No secrets provided, will not create secrets for ${slug}`);
        return [];
    }
    const ss: k8s.V1Secret[] = await Promise.all(req.secrets.map(async secret => {
        const secretName = `${req.ns}/${secret.metadata.name}`;
        const spec = await secretTemplate(req, secret);
        try {
            await req.clients.core.readNamespacedSecret(secret.metadata.name, spec.metadata.namespace);
        } catch (e) {
            logger.debug(`Failed to read secret ${secretName}, creating: ${errMsg(e)}`);
            logger.info(`Creating secret ${slug} using '${logObject(spec)}'`);
            await logRetry(() => req.clients.core.createNamespacedSecret(spec.metadata.namespace, spec),
                `create secret ${secretName} for ${slug}`);
            return spec;
        }
        logger.info(`Secret ${secretName} exists, patching using '${logObject(spec)}'`);
        await logRetry(() => req.clients.core.patchNamespacedSecret(secret.metadata.name, spec.metadata.namespace, spec,
            undefined, undefined, undefined, undefined, patchHeaders()), `patch secret ${secretName} for ${slug}`);
        return spec;
    }));
    return ss;
}

/**
 * Add labels to a secret so we can delete it later.
 *
 * @param secret the unlabeled secret
 * @return the provided secret with appropriate labels
 */
export async function secretTemplate(req: KubernetesApplication & KubernetesSdm, secret: k8s.V1Secret): Promise<k8s.V1Secret> {
    const labels = applicationLabels({ ...req, component: "secret" });
    const metadata = metadataTemplate({
        namespace: req.ns,
        labels,
    });
    const apiVersion = "v1";
    const kind = "Secret";
    const s: k8s.V1Secret = {
        type: "Opaque",
        metadata,
    };
    _.merge(s, secret, { apiVersion, kind });
    s.metadata.namespace = req.ns;
    return s;
}

/**
 * Create encoded opaque secret object from key/value pairs.
 *
 * @param secrets Key/value pairs of secrets, the values will be base64 encoded in the returned secret
 * @return Kubernetes secret object
 */
export function encodeSecret(name: string, data: { [key: string]: string }): k8s.V1Secret {
    const metadata = metadataTemplate({ name });
    // avoid https://github.com/kubernetes-client/javascript/issues/52
    const secret: Partial<k8s.V1Secret> = {
        apiVersion: "v1",
        kind: "Secret",
        type: "Opaque",
        metadata,
        data: {},
    };
    Object.keys(data).forEach(key => secret.data[key] = Buffer.from(data[key]).toString("base64"));
    return secret as k8s.V1Secret;
}

/**
 * Return a copy of the provided secret with its data values
 * encrypted.  The provided secret should have its data values base64
 * encoded.  The provided secret is not modified.
 *
 * @param secret Kubernetes secret with base64 encoded data values
 * @return Kubernetes secret object with encrypted data values
 */
export async function encryptSecret(secret: k8s.V1Secret, key: string): Promise<k8s.V1Secret> {
    const encrypted = handleDataStrings(_.cloneDeep(secret));
    for (const datum of Object.keys(encrypted.data)) {
        encrypted.data[datum] = await encrypt(encrypted.data[datum], key);
    }
    return encrypted;
}

/**
 * Return the provided secret with any data residing in the
 * stringData section base64 encoded and moved into the data section. Keys in
 * stringData will override existing keys in data.
 * @param secret Kubernetes secret with stringData elements
 * @return Kubernetes secret with stringData elements encoded and moved to data
 */
function handleDataStrings(secret: k8s.V1Secret): k8s.V1Secret {
    if (secret.stringData) {
        Object.keys(secret.stringData).forEach(key => secret.data[key] = Buffer.from(secret.stringData[key]).toString("base64"));
        delete secret.stringData;
    }
    return secret;
}

/**
 * Return a copy of the provided secret with its data valued
 * decrypted.  The provided secret is not modified.
 *
 * @param secret Kubernetes secret with encrypted data values
 * @return Kubernetes secret object with base64 encoded data values
 */
export async function decryptSecret(secret: k8s.V1Secret, key: string): Promise<k8s.V1Secret> {
    const decrypted = _.cloneDeep(secret);
    for (const datum of Object.keys(secret.data)) {
        decrypted.data[datum] = await decrypt(secret.data[datum], key);
    }
    return decrypted;
}
