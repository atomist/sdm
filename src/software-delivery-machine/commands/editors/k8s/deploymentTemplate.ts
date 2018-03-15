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

const creator = `atomist.k8-automation`;

/**
 * Create deployment for a repo and image.
 *
 * @param name deployment name
 * @param owner repository owner, i.e., organization or user
 * @param repo name of repository
 * @param teamId Atomist team ID
 * @param image full Docker image tag, i.e., [REGISTRY/]OWNER/NAME:VERSION
 * @param env deployment environment, e.g., "production" or "testing"
 * @return deployment resource
 */
export function deploymentTemplate(
    name: string,
    owner: string,
    repo: string,
    teamId: string,
    image: string,
    env: string,
): string {

    const baseImage = image.split(":")[0];
    const k8ventAnnot = JSON.stringify({
        environment: env,
        webhooks: [
            `${webhookBaseUrl()}/atomist/kube/teams/${teamId}`,
        ],
    });
    const repoImageAnnot = JSON.stringify([
        {
            container: name,
            repo: {
                owner,
                name: repo,
            },
            image: baseImage,
        },
    ]);
    const d = {
        apiVersion: "extensions/v1beta1",
        kind: "Deployment",
        metadata: {
            name,
            labels: {
                app: repo,
                owner,
                teamId,
                creator,
            },
        },
        spec: {
            replicas: 1,
            revisionHistoryLimit: 3,
            selector: {
                matchLabels: {
                    app: repo,
                    owner,
                    teamId,
                },
            },
            template: {
                metadata: {
                    name,
                    labels: {
                        app: repo,
                        owner,
                        teamId,
                        creator,
                    },
                    annotations: {
                        "atomist.com/k8vent": k8ventAnnot,
                        "atomist.com/repo-image": repoImageAnnot,
                    },
                },
                spec: {
                    containers: [
                        {
                            name,
                            image,
                            imagePullPolicy: "IfNotPresent",
                            resources: {
                                limits: {
                                    cpu: "300m",
                                    memory: "384Mi",
                                },
                                requests: {
                                    cpu: "100m",
                                    memory: "320Mi",
                                },
                            },
                            readinessProbe: {
                                httpGet: {
                                    path: "/info",
                                    port: "http",
                                    scheme: "HTTP",
                                },
                                initialDelaySeconds: 60,
                                timeoutSeconds: 3,
                                periodSeconds: 10,
                                successThreshold: 1,
                                failureThreshold: 3,
                            },
                            livenessProbe: {
                                httpGet: {
                                    path: "/health",
                                    port: "http",
                                    scheme: "HTTP",
                                },
                                initialDelaySeconds: 60,
                                timeoutSeconds: 3,
                                periodSeconds: 10,
                                successThreshold: 1,
                                failureThreshold: 3,
                            },
                            ports: [
                                {
                                    name: "http",
                                    containerPort: 8080,
                                    protocol: "TCP",
                                },
                            ],
                        },
                    ],
                },
            },
            strategy: {
                type: "RollingUpdate",
                rollingUpdate: {
                    maxUnavailable: 0,
                    maxSurge: 1,
                },
            },
        },
    };
    return JSON.stringify(d, null, 2);
}

/**
 * Scheme and hostname (authority) of the Atomist webhook URL.
 */
function webhookBaseUrl(): string {
    return process.env.ATOMIST_WEBHOOK_BASEURL || "https://webhook.atomist.com";
}
