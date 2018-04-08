import { Maker, toFactory } from "@atomist/automation-client/util/constructionUtils";
import { HandleCommand } from "@atomist/automation-client";
import { CommandHandlerMetadata } from "@atomist/automation-client/metadata/automationMetadata";
import { isCommandHandlerMetadata } from "@atomist/automation-client/internal/metadata/metadata";
import { FunctionalUnit } from "../../blueprint/FunctionalUnit";

export interface HandlerInfo {
    maker: Maker<HandleCommand<any>>;
    instance: HandleCommand<any> & CommandHandlerMetadata;
}

/**
 * Return command handlers with a given tag.
 * Note this may not find all, but it will find those that know their
 * own metadata, which is true of all those returned by generatorHandler
 * and the underlying commandHandlerFrom
 * @param {FunctionalUnit} unit
 * @param {string} tag
 */
export function commandHandlersWithTag(unit: FunctionalUnit, tag: string): HandlerInfo[] {
    return selfDescribingHandlers(unit)
        .filter(hi => hi.instance.tags.some(t => t.name === tag));
}

/**
 * Return command handlers along with their metadata
 * Note this may not find all, but it will find those that know their
 * own metadata
 * @param {FunctionalUnit} unit
 */
export function selfDescribingHandlers(unit: FunctionalUnit): HandlerInfo[] {
    return unit.commandHandlers
        .map(maker => ({maker, instance: toFactory(maker)()}))
        .filter(hi => isCommandHandlerMetadata(hi.instance)) as HandlerInfo[];
}
