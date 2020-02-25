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
import * as stringify from "json-stringify-safe";
import { DeepPartial } from "ts-essentials";
import { KubernetesClients } from "./clients";

/**
 * Information used to construct resources when creating or updating
 * an application in a Kubernetes cluster.  This structure is designed
 * for a typical microservice-type deployment of one container
 * optionally providing a service on a single port.  If you need
 * anything more complicated than that, you can use the various
 * partial specs in this structure to manage more elaborate
 * applications and the `applicationData` callback on the
 * [[KubernetesDeploymentRegistration]].
 */
export interface KubernetesApplication {
    /** Atomist workspace ID */
    workspaceId: string;
    /**
     * Name of resources to create.  It can be overriden for
     * individual resources in the partial specs.
     */
    name: string;
    /** Namespace to create resources in. */
    ns: string;
    /** Full image name and tag for deployment pod template container. */
    image: string;
    /**
     * Mode of operation.  If not provided, the "full" mode is used,
     * making calls to the Kubernetes API and, if configured,
     * persisting changes to the sync/GitOps repo.  If set to "sync",
     * it will only persist changes to the configured sync/GitOps
     * repo, making no calls to the Kubernetes API.
     */
    mode?: "full" | "sync";
    /**
     * Name of image pull secret for container image, if not provided
     * no image pull secret is provided in the pod spec.
     * Prefer deploymentSpec.
     */
    imagePullSecret?: string;
    /**
     * Number of replicas in deployment.  May be overridden by
     * deploymentSpec.
     * Prefer deploymentSpec
     */
    replicas?: number;
    /**
     * Port the service listens on, if not provided, no service
     * resource is created.
     */
    port?: number;
    /**
     * Ingress rule URL path, if not provided no ingress rule is
     * added.  Typically ingress paths start with a forward slash
     * ("/") but do not end with one, unless the path is just "/".
     */
    path?: string;
    /**
     * Ingress rule hostname, if not provided none is used in the
     * ingress rule, meaning it will apply to the wildcard host, and
     * "localhost" is used when constructing the service endpoint URL.
     * Prefer ingressSpec
     */
    host?: string;
    /**
     * Ingress protocol, "http" or "https".  If tslSecret is provided,
     * the default is "https", otherwise "http".
     * Prefer ingressSpec
     */
    protocol?: "http" | "https";
    /**
     * Name of TLS secret for host
     * Prefer ingressSpec
     */
    tlsSecret?: string;
    /**
     * Partial deployment spec for this application that is overlaid
     * on top of the default deployment spec template.  It can be used
     * to provide custom resource specifications, liveness and
     * readiness checks, etc.
     */
    deploymentSpec?: DeepPartial<k8s.V1Deployment>;
    /**
     * Partial service spec for this application that is overlaid on
     * top of the default service spec template.
     */
    serviceSpec?: DeepPartial<k8s.V1Service>;
    /**
     * Partial ingress spec for this application that is overlaid on
     * top of the default ingress spec template.
     */
    ingressSpec?: DeepPartial<k8s.NetworkingV1beta1Ingress>;
    /**
     * Secrets to upsert prior to creating deployment.
     */
    secrets?: k8s.V1Secret[];
    /**
     * Partial role to create for binding to service account.  If
     * provided, this partial spec is overlaid onto the default role
     * spec, which is just metadata with no rules.  If this is not
     * defined, this deployment will not create a role and therefore
     * not bind a role to a service account.
     */
    roleSpec?: DeepPartial<k8s.V1Role> | DeepPartial<k8s.V1ClusterRole>;
    /**
     * Partial service account spec to create and use in the
     * deployment.  This partial spec is overlaid onto the default
     * service account spec.  If the `serviceAccountSpec` is provided,
     * the resulting service account spec is upserted during
     * deployment.  If a `roleSpec` is provided, the resulting service
     * account spec is upserted during deployment and a role binding
     * is created between the role and service account.  If neither
     * the `serviceAccountSpec` nor `roleSpec` are created, no service
     * account is managed by the deployment.  If this spec contains a
     * name, it is used in the role binding and deployment specs.
     */
    serviceAccountSpec?: DeepPartial<k8s.V1ServiceAccount>;
    /**
     * Partial role binding spec for the role to service account.
     * This partial spec is overlaid onto the default role binding
     * spec, which contains metadata and the role and service account
     * names.  The role binding is only created if the `roleSpec` is
     * also provided.
     */
    roleBindingSpec?: DeepPartial<k8s.V1RoleBinding> | DeepPartial<k8s.V1ClusterRoleBinding>;
}

/**
 * Information needed to delete resources related to an application in
 * a Kubernetes cluster.
 */
export type KubernetesDelete = Pick<KubernetesApplication, "name" | "ns" | "workspaceId" | "mode">;

/**
 * Intermediate interface for use in combination with other
 * interfaces.
 */
export interface KubernetesClientsContainer {
    /** Kubernetes API group clients. */
    clients: KubernetesClients;
}
export interface KubernetesSdm {
    /** Name of SDM fulfilling the goal. */
    sdmFulfiller: string;
}

/**
 * Internal application structure used to create or update resources
 * in a Kubernetes cluster.
 */
export type KubernetesResourceRequest = KubernetesApplication & KubernetesClientsContainer & KubernetesSdm;

/**
 * Internal application structure used to delete resources from a
 * Kubernetes cluster.
 */
export type KubernetesDeleteResourceRequest = KubernetesDelete & KubernetesClientsContainer;

/** Qualified name of Kubernetes application */
export function appName(k: Pick<KubernetesApplication, "name" | "ns">): string {
    return `${k.ns}/${k.name}`;
}

/**
 * Test if the object is a valid [[KubernetesApplication]] by checking
 * if it has all required properties.
 *
 * @param o Putative Kubernetes application data
 * @return `true` if all required properties are present, `false` otherwise.
 */
export function isKubernetesApplication(o: { [key: string]: any }): o is KubernetesApplication {
    if (!o) {
        return false;
    }
    const required = ["image", "name", "ns", "workspaceId"];
    return required.every(k => o[k]);

}

/** Stringify filter for a Kubernetes request object. */
export function reqFilter<T>(k: string, v: T): T | undefined {
    if (k === "config" || k === "clients" || k === "secrets") {
        return undefined;
    }
    return v;
}

/** Stringify a Kubernetes request object. */
export function reqString(req: any): string {
    return stringify(req, reqFilter, undefined, () => undefined);
}
