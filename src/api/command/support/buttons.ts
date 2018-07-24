import { buttonForCommand, ButtonSpecification } from "@atomist/automation-client/spi/message/MessageClient";
import { Action } from "@atomist/slack-messages";
import { CommandHandlerRegistration } from "../../..";

/**
 * Create an actionable button invoking the given command
 * @param {ButtonSpecification} buttonSpec
 * @param {CommandHandlerRegistration<T>} commandHandlerRegistration command registration
 * @param {T} parameters parameters to the command
 * @return {Action}
 */
export function actionableButton<T>(
    buttonSpec: ButtonSpecification,
    commandHandlerRegistration: CommandHandlerRegistration<T>,
    parameters?: Partial<T>): Action {
    return buttonForCommand(buttonSpec,
        commandHandlerRegistration.name,
        toFlattenedProperties(parameters));
}

export interface ParamsSpec {
    [name: string]: string | number | boolean;
}

/**
 * Convert nested properties to flattened property paths.
 * E.g. convert targets.owner to a top-level property named "targets.owner"
 * @param o
 * @return {ParamsSpec}
 */
export function toFlattenedProperties(o: any): ParamsSpec {
    const result = {};
    addPropertiesFrom("", o, result);
    return result;
}

function addPropertiesFrom(prefix: string, o: any, output: ParamsSpec) {
    if (!o) {
        return;
    }
    for (const propName of Object.getOwnPropertyNames(o)) {
        const val = o[propName];
        const outputPropName = !!prefix ? (prefix + "." + propName) : propName;
        if (typeof val === "object") {
            addPropertiesFrom(outputPropName, val, output);
        } else {
            output[outputPropName] = val;
        }
    }
}
