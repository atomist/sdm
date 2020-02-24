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

import { successOn } from "@atomist/automation-client/lib/action/ActionResult";
import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { HandleEvent } from "@atomist/automation-client/lib/HandleEvent";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { ProjectOperationCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import { RepoId } from "@atomist/automation-client/lib/operations/common/RepoId";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { BuildableAutomationServer } from "@atomist/automation-client/lib/server/BuildableAutomationServer";
import { MessageClient } from "@atomist/automation-client/lib/spi/message/MessageClient";
import { Maker } from "@atomist/automation-client/lib/util/constructionUtils";
import * as assert from "assert";
import * as flatten from "flat";
import * as _ from "lodash";
import { AbstractSoftwareDeliveryMachine } from "../../../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { generatorRegistrationToCommand } from "../../../../api-helper/machine/handlerRegistrations";
import { SoftwareDeliveryMachineConfiguration } from "../../../../api/machine/SoftwareDeliveryMachineOptions";
import { GeneratorRegistration } from "../../../../api/registration/GeneratorRegistration";
import { defaultSoftwareDeliveryMachineConfiguration } from "../../../machine/defaultSoftwareDeliveryMachineConfiguration";
import { toArray } from "../../../util/misc/array";
import { invokeCommand } from "../../job/invokeCommand";
import { universalGenerator } from "../generator";
import { UniversalTransform } from "../generatorSupport";

export interface AssertGeneratorResult {
    id: RepoId;
    project: Project;
    parameters: Record<string, any>;
}

export async function assertUniversalGenerator(generatorUnderTest: GeneratorRegistration<any>,
                                               transformsUnderTest: UniversalTransform<any> | Array<UniversalTransform<any>>,
                                               initialParams: Record<string, any>,
                                               promptForParams: Record<string, any> = {}): Promise<AssertGeneratorResult> {
    try {
        // Prepare the result of generator run
        let project: Project;
        let id: RepoId;
        let params: Record<string, any>;

        // Set up configuration and overwrite the projectPersister to capture the result of the generator
        const configuration: SoftwareDeliveryMachineConfiguration = _.merge({},
            {
                ...defaultSoftwareDeliveryMachineConfiguration({}),
                name: "test",
            },
            {
                sdm: {
                    projectPersister: async (p: Project,
                                             credentials: ProjectOperationCredentials,
                                             targetId: RepoId,
                                             parameters?: object) => {
                        project = p;
                        id = targetId;
                        params = parameters;
                        return successOn<Project>(p);
                    },
                },
            });

        const automationServer = new BuildableAutomationServer({});
        const sdm = new TestSoftwareDeliveryMachine("test", configuration);

        (global as any).__runningAutomationClient = {
            configuration,
            automationServer,
        };

        // Create the generator instance and register it with the underlying automation client
        const generator = universalGenerator(sdm, generatorUnderTest, toArray(transformsUnderTest));
        automationServer.registerCommandHandler(generatorRegistrationToCommand(sdm, generator));

        let parameterSpecs: any[] = [];
        const messageClient: MessageClient = {
            respond: async msg => {
                if (!!msg.parameter_specs) {
                    parameterSpecs = msg.parameter_specs;
                }
            },
            send: async () => {
            },
            delete: async () => {
            },
        };

        // Invoke the generator with the initial set of parameters
        let result = await invokeCommand(generatorUnderTest, initialParams, mockHandlerContext(messageClient, initialParams));
        assert.deepStrictEqual(result.code, 0, `Generator failed during initial execution: ${result.message}`);
        assert.deepStrictEqual(parameterSpecs.map(p => p.name).sort(), _.keys(promptForParams).sort());

        if (!!project) {
            return {
                id,
                project,
                parameters: params,
            };
        }

        // Now invoke generator with additional parameters needed by the matched transformsAndParameters
        const allParameters = { ...initialParams, ...promptForParams };
        result = await invokeCommand(
            generatorUnderTest,
            allParameters,
            mockHandlerContext(messageClient, allParameters));
        assert.deepStrictEqual(result.code, 0, `Generator failed during parameter prompt execution: ${result.message}`);
        assert(!!project, "Generated project is undefined");

        return {
            id,
            project,
            parameters: params,
        };
    } finally {
        delete (global as any).__runningAutomationClient;
    }
}

function mockHandlerContext(messageClient: MessageClient, params: any): HandlerContext {
    return {
        messageClient,
        trigger: {
            parameters: flattenParameters(params),
        },
        invocationId: guid(),
        correlationId: guid(),
        graphClient: undefined,
        workspaceId: `A${guid().slice(0, 7).toUpperCase()}`,
    } as any;
}

function flattenParameters(params: any): any {
    const parameters: any[] = [];
    _.forEach(flatten(params), (v, k) => {
        parameters.push({ name: k, value: v });
    });
    return parameters;
}

class TestSoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    public readonly commandHandlers: Array<Maker<HandleCommand>> = [];
    public readonly eventHandlers: Array<Maker<HandleEvent<any>>> = [];
    public readonly ingesters: string[] = [];

    constructor(name: string, configuration: SoftwareDeliveryMachineConfiguration) {
        super(name, configuration, []);
    }
}
