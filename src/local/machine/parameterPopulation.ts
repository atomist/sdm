import * as _ from "lodash";
import { Configuration, HandleCommand, HandlerContext, HandlerResult, SuccessPromise } from "@atomist/automation-client";
import { isSmartParameters, isValidationError, ValidationResult } from "@atomist/automation-client/SmartParameters";
import {
    AutomationMetadata,
    Chooser,
    CommandHandlerMetadata,
    FreeChoices,
    ParameterType
} from "@atomist/automation-client/metadata/automationMetadata";
import { Arg } from "@atomist/automation-client/internal/invoker/Payload";

// Based on code from automation-client

export function invokeCommandHandlerWithFreshParametersInstance<P>(h: HandleCommand<P>,
                                                                   md: CommandHandlerMetadata,
                                                                   params: P,
                                                                   args: Arg[],
                                                                   ctx: HandlerContext): Promise<HandlerResult> {
    populateParameters(params, md, args);
    populateValues(params, md, {});
    // this.populateSecrets(params, md, invocation.secrets);

    const bindAndValidate: Promise<ValidationResult> =
        isSmartParameters(params) ?
            Promise.resolve(params.bindAndValidate()) :
            Promise.resolve();

    return bindAndValidate
        .then(vr => {
            if (isValidationError(vr)) {
                return Promise.reject(`Validation failure invoking command handler '${md.name}': [${vr.message}]`);
            }

            const handlerResult = h.handle(ctx, params);
            if (!handlerResult) {
                return SuccessPromise;
            }
            return (handlerResult as Promise<HandlerResult>)
                .then(result => {
                    if (result) {
                        return result;
                    } else {
                        return SuccessPromise;
                    }
                });
        });
}

/**
 * Populate the parameters of the command handler instance,
 * performing type coercion if necessary
 * @param instanceToPopulate parameters instance (may be handler instance itself)
 * @param hm handler metadata
 * @param args string args
 */
function populateParameters(instanceToPopulate: any, hm: CommandHandlerMetadata, args: Arg[]) {
    const allParams = hm.parameters.concat(hm.mapped_parameters);
    args.forEach(arg => {
        if (arg.value !== undefined) {
            const parameter = allParams.find(p => p.name === arg.name);
            if (parameter) {
                _.update(instanceToPopulate, parameter.name, () => computeValue(parameter, arg.value));
            }
        }
    });
}

function populateValues(instanceToPopulate: any, am: AutomationMetadata, configuration: Configuration) {
    (am.values || []).forEach(v => {
        const configValue = _.get(configuration, v.path);
        if (!configValue && v.required) {
            throw new Error(`Required @Value '${v.path}' in '${
                instanceToPopulate.constructor.name}' is not available in configuration`);
        } else {
            _.update(instanceToPopulate, v.name, () => computeValue(
                {name: v.name, type: v.type as any as ParameterType}, configValue));
        }
    });
}

function computeValue(parameter: { name: string, type?: ParameterType }, value: any) {
    // Convert type if necessary
    switch (parameter.type) {
        case "string":
        case undefined:
            // It's a string. Keep the value the same
            break;
        case FreeChoices:
            // It's a string array. Keep the value the same
            break;
        case "boolean":
            if (typeof value !== "boolean") {
                value = value === "true" || value === "yes" || value === "1";
            }
            break;
        case "number":
            if (typeof value === "string") {
                value = parseInt(value, 10);
            } else {
                throw new Error(`Parameter '${parameter.name}' has array value, but is numeric`);
            }
            break;
        default:
            // It's a Chooser
            const chooser = parameter.type as Chooser;
            if (chooser.pickOne) {
                if (typeof value !== "string") {
                    throw new Error(`Parameter '${parameter.name}' has array value, but should be string`);
                }
            } else {
                if (typeof value.value === "string") {
                    throw new Error(`Parameter '${parameter.name}' has string value, but should be array`);
                }
            }
            break;
    }
    return value;
}
