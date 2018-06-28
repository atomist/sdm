/*
 * Copyright © 2018 Atomist, Inc.
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

import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { CommandRegistrationManager } from "../../api/machine/CommandRegistrationManager";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";
import { EditorRegistration } from "../../api/registration/EditorRegistration";
import { EventHandlerRegistration } from "../../api/registration/EventHandlerRegistration";
import { EventRegistrationManager } from "../../api/registration/EventRegistrationManager";
import { GeneratorRegistration } from "../../api/registration/GeneratorRegistration";
import { IngesterRegistration } from "../../api/registration/IngesterRegistration";
import { IngesterRegistrationManager } from "../../api/registration/IngesterRegistrationManager";
import {
    commandHandlerRegistrationToCommand,
    editorRegistrationToCommand,
    eventHandlerRegistrationToEvent,
    generatorRegistrationToCommand,
} from "./handlerRegistrations";
import { MachineOrMachineOptions } from "./toMachineOptions";

/**
 * Concrete implementation of CommandRegistrationManager and
 * HandlerRegistrationManager
 */
export class HandlerRegistrationManagerSupport
    implements CommandRegistrationManager, EventRegistrationManager, IngesterRegistrationManager {

    constructor(private readonly sdm: MachineOrMachineOptions) {
    }

    public commandHandlers: Array<Maker<HandleCommand>> = [];

    public eventHandlers: Array<Maker<HandleEvent<any>>> = [];

    public ingesters: string[] = [];

    public addCommand<P>(cmd: CommandHandlerRegistration<P>): this {
        const command = commandHandlerRegistrationToCommand(this.sdm, cmd);
        this.commandHandlers.push(command);
        return this;
    }

    public addGenerator<P extends SeedDrivenGeneratorParameters>(gen: GeneratorRegistration<P>): this {
        const command = generatorRegistrationToCommand(this.sdm, gen);
        this.commandHandlers.push(command);
        return this;
    }

    public addEditor<P>(ed: EditorRegistration<P>): this {
        const commands = [editorRegistrationToCommand(this.sdm, ed)];
        this.commandHandlers = this.commandHandlers.concat(commands);
        return this;
    }

    public addEvent<T, P>(e: EventHandlerRegistration<T, P>): this {
        const events = [eventHandlerRegistrationToEvent(this.sdm, e)];
        this.eventHandlers = this.eventHandlers.concat(events);
        return this;
    }

    public addIngester(i: IngesterRegistration): this {
        const ingesters = [i.ingester];
        this.ingesters = this.ingesters.concat(ingesters);
        return this;
    }

}
