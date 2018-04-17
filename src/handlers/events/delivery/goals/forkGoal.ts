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

import {
    AutomationContextAware,
    HandlerContext,
    HandlerResult,
    logger,
    Secrets,
} from "@atomist/automation-client";
import { ApolloGraphClient } from "@atomist/automation-client/graph/ApolloGraphClient";
import {
    EventIncoming,
    RequestProcessor,
} from "@atomist/automation-client/internal/transport/RequestProcessor";
import { RegistrationConfirmation } from "@atomist/automation-client/internal/transport/websocket/WebSocketRequestProcessor";
import { guid } from "@atomist/automation-client/internal/util/string";
import { AutomationEventListenerSupport } from "@atomist/automation-client/server/AutomationEventListener";
import { BuildableAutomationServer } from "@atomist/automation-client/server/BuildableAutomationServer";
import { QueryNoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import * as appRoot from "app-root-path";
import * as fs from "fs-extra";
import {
    OnAnyRequestedSdmGoal,
    ProgressLog,
    SdmGoalById,
} from "../../../..";
import { SdmGoalImplementationMapper } from "../../../../common/delivery/goals/SdmGoalImplementationMapper";
import { ProjectLoader } from "../../../../common/repo/ProjectLoader";
import { spawnAndWatch } from "../../../../util/misc/spawned";
import { FulfillGoalOnRequested } from "./FulfillGoalOnRequested";

export async function executeGoalForked(goal: OnAnyRequestedSdmGoal.SdmGoal,
                                        ctx: HandlerContext,
                                        progressLog: ProgressLog): Promise<HandlerResult> {
    const jobSpec = JSON.parse(JobSpec);

    // TODO CD the following code needs to be replace with proper job scheduling via k8-automation

    // Update the spec for the most update to date values
    const pj = require(`${appRoot.path}/package.json`);
    let name = pj.name;
    if (name.indexOf("/") >= 0) {
        name = name.split("/")[1];
    }
    const version = pj.version;
    jobSpec.metadata.name = `${name}-goal-${goal.id}`;
    jobSpec.spec.template.spec.containers[0].name = name;
    jobSpec.spec.template.spec.containers[0].image = `sforzando-dockerv2-local.jfrog.io/${name}:${version}`;
    jobSpec.spec.template.spec.containers[0].env.push({
            name: "ATOMIST_GOAL_TEAM",
            value: ctx.teamId,
        },
        {
            name: "ATOMIST_GOAL_TEAM_NAME",
            value: (ctx as any as AutomationContextAware).context.teamName,
        },
        {
            name: "ATOMIST_GOAL_ID",
            value: goal.id,
        },
        {
            name: "ATOMIST_CORRELATION_ID",
            value: ctx.correlationId,
        },
        {
            name: "ATOMIST_FORKED",
            value: "true",
        });

    const tempfile = require("tempfile")(".json");
    await fs.writeFile(tempfile, JSON.stringify(jobSpec, null, 2));

    return spawnAndWatch({
        command: "kubectl",
        args: ["create", "-f", tempfile],
        },
        {},
          progressLog,
        {
            errorFinder: code => code !== 0,
        },
    );
}

export class GoalAutomationEventListener extends AutomationEventListenerSupport {

    constructor(private readonly implementationMapper: SdmGoalImplementationMapper,
                private readonly projectLoader: ProjectLoader) {
        super();
    }

    public async registrationSuccessful(eventHandler: RequestProcessor) {
        const registration = (eventHandler as any).registration as RegistrationConfirmation;
        const automationServer = (eventHandler as any).automations as BuildableAutomationServer;
        const teamId = process.env.ATOMIST_GOAL_TEAM;
        const teamName = process.env.ATOMIST_GOAL_TEAM_NAME || teamId;
        const goalId = process.env.ATOMIST_GOAL_ID;
        const correlationId = process.env.ATOMIST_CORRELATION_ID || guid();

        // Obtain goal via graphql query
        const graphClient = new ApolloGraphClient(
            `https://automation.atomist.com/graphql/team/${teamId}`,
            { Authorization: `Bearer ${registration.jwt}`});

        const goal = await graphClient.query<SdmGoalById.Query, SdmGoalById.Variables>({
            name: "SdmGoalById",
            variables: {
                id: goalId,
            },
            options: QueryNoCacheOptions,
        });

        // Register event handler locally only
        const maker = () => new FulfillGoalOnRequested(this.implementationMapper, this.projectLoader);
        automationServer.registerEventHandler(maker);

        // Create event and run event handler
        const event: EventIncoming = {
            data: goal,
            extensions: {
                correlation_id: correlationId,
                team_id: teamId,
                team_name: teamName,
                operationName: maker().subscriptionName,
            },
            secrets: [{
                uri: Secrets.OrgToken,
                value: process.env.GITHUB_TOKEN,
            }],
        };
        await eventHandler.processEvent(event, async results => {
            const resolved = await results;
            logger.info("Processing goal completed with results %j", resolved);
            process.exit(0);
        });
    }
}

const JobSpec = `{
    "kind" : "Job",
    "apiVersion" : "batch/v1",
    "metadata" : {
      "name" : "sample-sdm-job",
      "namespace" : "default"
    },
    "spec" : {
      "template" : {
        "spec" : {
          "containers" : [ {
            "volumeMounts" : [ {
              "mountPath" : "/var/run",
              "name" : "docker-sock"
            } ],
            "readinessProbe" : {
              "httpGet" : {
                "path" : "/health",
                "port" : 2866,
                "scheme" : "HTTP"
              },
              "initialDelaySeconds" : 20,
              "timeoutSeconds" : 3,
              "periodSeconds" : 10,
              "successThreshold" : 1,
              "failureThreshold" : 3
            },
            "name" : "github-sdm",
            "env" : [ {
              "name" : "APP_NAME",
              "value" : "sample-sdm"
            }, {
              "name" : "NODE_ENV",
              "value" : "production"
            }, {
              "name" : "FORCE_COLOR",
              "value" : "1"
            }, {
              "name" : "ATOMIST_TOKEN",
              "valueFrom" : {
                "secretKeyRef" : {
                  "name" : "atomist",
                  "key" : "token"
                }
              }
            }, {
              "name" : "GITHUB_TOKEN",
              "valueFrom" : {
                "secretKeyRef" : {
                  "name" : "atomist",
                  "key" : "token"
                }
              }
            }, {
              "name" : "ATOMIST_TEAMS",
              "valueFrom" : {
                "secretKeyRef" : {
                  "name" : "atomist",
                  "key" : "teams"
                }
              }
            }, {
              "name" : "ATOMIST_DOCKER_REGISTRY",
              "valueFrom" : {
                "secretKeyRef" : {
                  "name" : "docker",
                  "key" : "registry"
                }
              }
            }, {
              "name" : "ATOMIST_DOCKER_USER",
              "valueFrom" : {
                "secretKeyRef" : {
                  "name" : "docker",
                  "key" : "user"
                }
              }
            }, {
              "name" : "ATOMIST_DOCKER_PASSWORD",
              "valueFrom" : {
                "secretKeyRef" : {
                  "name" : "docker",
                  "key" : "password"
                }
              }
            }, {
              "name" : "ATOMIST_NPM",
              "valueFrom" : {
                "secretKeyRef" : {
                  "name" : "npm",
                  "key" : "config"
                }
              }
            } ],
            "ports" : [ {
              "name" : "http",
              "containerPort" : 2866,
              "protocol" : "TCP"
            } ],
            "livenessProbe" : {
              "httpGet" : {
                "path" : "/health",
                "port" : 2866,
                "scheme" : "HTTP"
              },
              "initialDelaySeconds" : 60,
              "timeoutSeconds" : 3,
              "periodSeconds" : 10,
              "successThreshold" : 1,
              "failureThreshold" : 3
            },
            "terminationMessagePath" : "/dev/termination-log",
            "imagePullPolicy" : "Always",
            "image" : "sforzando-dockerv2-local.jfrog.io/sample-sdm:0.0.1",
            "resources" : {
              "limits" : {
                "cpu" : 2.0,
                "memory" : "3000Mi"
              },
              "requests" : {
                "cpu" : 0.5,
                "memory" : "1000Mi"
              }
            }
          } ],
          "volumes" : [ {
            "name" : "docker-sock",
            "hostPath" : {
              "path" : "/var/run"
            }
          } ],
          "restartPolicy" : "Never",
          "terminationGracePeriodSeconds" : 30,
          "dnsPolicy" : "ClusterFirst",
          "securityContext" : { },
          "imagePullSecrets" : [ {
            "name" : "atomistjfrog"
          } ]
        }
      }
    }
  }`;
