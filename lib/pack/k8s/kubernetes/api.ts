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

import * as k8s from "@kubernetes/client-node";
import * as http from "http";
import * as request from "request";
import { requestError } from "../support/error";
import { K8sDefaultNamespace } from "../support/namespace";
import { logObject } from "./resource";

/** Response from methods that operate on an resource. */
export interface K8sObjectResponse {
    body: k8s.KubernetesObject;
    response: http.IncomingMessage;
}

/** Response from list method. */
export interface K8sListResponse {
    body: k8s.KubernetesListObject<k8s.KubernetesObject>;
    response: http.IncomingMessage;
}

/** Response from delete method. */
export interface K8sDeleteResponse {
    body: k8s.V1Status;
    response: http.IncomingMessage;
}

/** Response from list API method. */
export interface K8sApiResponse {
    body: k8s.V1APIResourceList;
    response: http.IncomingMessage;
}

/** Union type of all response types. */
type K8sRequestResponse = K8sObjectResponse | K8sDeleteResponse | K8sListResponse | K8sApiResponse;

/** Kubernetes API verbs. */
export type K8sApiAction = "create" | "delete" | "list" | "patch" | "read" | "replace";

/** Type of option argument for object API requests. */
export interface K8sObjectRequestOptions { headers: { [name: string]: string; }; }

/**
 * Valid Content-Type header values for patch operations.  See
 * https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/
 * for details.
 */
export enum K8sPatchStrategies {
    /** Diff-like JSON format. */
    JsonPatch = "application/json-patch+json",
    /** Simple merge. */
    MergePatch = "application/merge-patch+json",
    /** Merge with different strategies depending on field metadata. */
    StrategicMergePatch = "application/strategic-merge-patch+json",
}

/**
 * Dynamically construct Kubernetes API request URIs so client does
 * not have to know what type of object it is acting on, create the
 * appropriate client, and call the appropriate method.
 */
export class K8sObjectApi extends k8s.ApisApi {

    private static readonly defaultDeleteBody: k8s.V1DeleteOptions = { propagationPolicy: "Background" };

    /**
     * Read any Kubernetes resource.
     */
    public async create(spec: k8s.KubernetesObject, options?: K8sObjectRequestOptions): Promise<K8sObjectResponse> {
        const requestOptions = this.baseRequestOptions("POST", options);
        requestOptions.uri += await this.specUriPath(spec, "create");
        requestOptions.body = spec;
        return this.requestPromise(requestOptions) as unknown as K8sObjectResponse;
    }

    /**
     * Delete any Kubernetes resource.
     */
    public async delete(spec: k8s.KubernetesObject, body?: k8s.V1DeleteOptions, options?: K8sObjectRequestOptions): Promise<K8sDeleteResponse> {
        const requestOptions = this.baseRequestOptions("DELETE", options);
        requestOptions.uri += await this.specUriPath(spec, "delete");
        requestOptions.body = body || K8sObjectApi.defaultDeleteBody;
        return this.requestPromise(requestOptions) as unknown as K8sDeleteResponse;
    }

    /**
     * List any Kubernetes resource.
     */
    public async list(spec: k8s.KubernetesObject, options?: K8sObjectRequestOptions): Promise<K8sListResponse> {
        const requestOptions = this.baseRequestOptions("GET", options);
        requestOptions.uri += await this.specUriPath(spec, "list");
        return this.requestPromise(requestOptions) as unknown as K8sListResponse;
    }

    /**
     * Patch any Kubernetes resource.
     */
    public async patch(spec: k8s.KubernetesObject, options?: K8sObjectRequestOptions): Promise<K8sObjectResponse> {
        const requestOptions = this.baseRequestOptions("PATCH", options);
        requestOptions.uri += await this.specUriPath(spec, "patch");
        requestOptions.body = spec;
        return this.requestPromise(requestOptions) as unknown as K8sObjectResponse;
    }

    /**
     * Read any Kubernetes resource.
     */
    public async read(spec: k8s.KubernetesObject, options?: K8sObjectRequestOptions): Promise<K8sObjectResponse> {
        const requestOptions = this.baseRequestOptions("GET", options);
        requestOptions.uri += await this.specUriPath(spec, "read");
        return this.requestPromise(requestOptions) as unknown as K8sObjectResponse;
    }

    /**
     * Replace any Kubernetes resource.
     */
    public async replace(spec: k8s.KubernetesObject, options?: K8sObjectRequestOptions): Promise<K8sObjectResponse> {
        const requestOptions = this.baseRequestOptions("PUT", options);
        requestOptions.uri += await this.specUriPath(spec, "replace");
        requestOptions.body = spec;
        return this.requestPromise(requestOptions) as unknown as K8sObjectResponse;
    }

    /**
     * Get metadata from Kubernetes API for resources described by
     * `kind` and `apiVersion`.  If it is unable to find the resource
     * `kind` under the provided `apiVersion`, `undefined` is
     * returned.
     */
    public async resource(apiVersion: string, kind: string): Promise<k8s.V1APIResource | undefined> {
        try {
            const requestOptions = this.baseRequestOptions();
            const prefix = (apiVersion.includes("/")) ? "apis" : "api";
            requestOptions.uri += [prefix, apiVersion].join("/");
            const getApiResponse = await this.requestPromise(requestOptions);
            const apiResourceList = getApiResponse.body as unknown as k8s.V1APIResourceList;
            return apiResourceList.resources.find(r => r.kind === kind);
        } catch (e) {
            e.message = `Failed to fetch resource metadata for ${apiVersion}/${kind}: ${e.message}`;
            throw e;
        }
    }

    /**
     * Generate request options.  Largely copied from the common
     * elements of @kubernetes/client-node action methods.
     */
    public baseRequestOptions(method: string = "GET", options?: K8sObjectRequestOptions): request.UriOptions & request.CoreOptions {
        const localVarPath = this.basePath + "/";
        const queryParameters = {};
        const headerParams = Object.assign({}, this.defaultHeaders, K8sObjectApi.methodHeaders(method), options?.headers || {});
        const requestOptions = {
            method,
            qs: queryParameters,
            headers: headerParams,
            uri: localVarPath,
            useQuerystring: this._useQuerystring,
            json: true,
        };
        this.authentications.BearerToken.applyToRequest(requestOptions);
        this.authentications.default.applyToRequest(requestOptions);
        return requestOptions;
    }

    /**
     * Use spec information to construct resource URI path.  If any
     * required information in not provided, an Error is thrown.  If an
     * `apiVersion` is not provided, "v1" is used.  If a `metadata.namespace`
     * is not provided for a request that requires one, "default" is used.
     *
     * @param spec resource spec which must kind and apiVersion properties
     * @param action API action, see [[K8sApiAction]]
     * @return tail of resource-specific URI
     */
    public async specUriPath(spec: k8s.KubernetesObject, action: K8sApiAction): Promise<string> {
        if (!spec.kind) {
            throw new Error(`Spec does not contain kind: ${logObject(spec)}`);
        }
        if (!spec.apiVersion) {
            spec.apiVersion = "v1";
        }
        if (!spec.metadata) {
            spec.metadata = {};
        }
        const resource = await this.resource(spec.apiVersion, spec.kind);
        if (!resource) {
            throw new Error(`Unrecognized API version and kind: ${spec.apiVersion} ${spec.kind}`);
        }
        if (namespaceRequired(resource, action) && !spec.metadata.namespace) {
            spec.metadata.namespace = K8sDefaultNamespace;
        }
        const prefix = (spec.apiVersion.includes("/")) ? "apis" : "api";
        const parts = [prefix, spec.apiVersion];
        if (resource.namespaced && spec.metadata.namespace) {
            parts.push("namespaces", spec.metadata.namespace);
        }
        parts.push(resource.name);
        if (appendName(action)) {
            if (!spec.metadata.name) {
                throw new Error(`Spec does not contain name: ${logObject(spec)}`);
            }
            parts.push(spec.metadata.name);
        }
        return parts.join("/").toLowerCase();
    }

    /**
     * Wrap request in a Promise.  Largely copied from @kubernetes/client-node/dist/api.js.
     */
    private requestPromise(requestOptions: request.UriOptions & request.CoreOptions): Promise<K8sRequestResponse> {
        return new Promise((resolve, reject) => {
            request(requestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    if (response.statusCode >= 200 && response.statusCode <= 299) {
                        resolve({ response, body });
                    } else {
                        reject(requestError({ response, body }));
                    }
                }
            });
        });
    }

    /**
     * Return default headers based on action.
     */
    private static methodHeaders(method: string): { [name: string]: string } {
        return (method === "PATCH") ? { "Content-Type": K8sPatchStrategies.StrategicMergePatch } : {};
    }
}

/**
 * Return whether the name of the resource should be appended to the
 * API URI path.  When creating and listing resources, it is not
 * appended.
 *
 * @param action API action, see [[K8sApiAction]]
 * @return true if name should be appended to URI
 */
export function appendName(action: K8sApiAction): boolean {
    return !(action === "create" || action === "list");
}

/**
 * Return whether namespace must be included in resource API URI.
 * It returns true of the resource is namespaced and the action is
 * not "list".  The namespace can be provided when the action is
 * "list", but it need not be.
 *
 * @param resource resource metadata
 * @param action API action, see [[K8sApiAction]]
 * @return true is the namespace is required in the API URI path
 */
export function namespaceRequired(resource: k8s.V1APIResource, action: K8sApiAction): boolean {
    // return action !== "list" || resource.namespaced;
    // return !(action === "list" || !resource.namespaced);
    return resource.namespaced && action !== "list";
}
