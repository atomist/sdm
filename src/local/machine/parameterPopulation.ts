import { Configuration, HandleCommand, HandlerContext, HandlerResult, SuccessPromise } from "@atomist/automation-client";
import { Arg } from "@atomist/automation-client/internal/invoker/Payload";
import {
    AutomationMetadata,
    Chooser,
    CommandHandlerMetadata,
    FreeChoices,
    ParameterType,
} from "@atomist/automation-client/metadata/automationMetadata";
import { isSmartParameters, isValidationError, ValidationResult } from "@atomist/automation-client/SmartParameters";
import { SecretResolver } from "@atomist/automation-client/spi/env/SecretResolver";
import * as _ from "lodash";
import { MappedParameterResolver } from "../binding/MappedParameterResolver";

/**
 * Try to resolve secrets from arguments
 */
class ArgsSecretResolver implements SecretResolver {

    constructor(private readonly args: Arg[]) {
    }

    public resolve(key: string): string {
        const arg = this.args.find(a => a.name === key);
        if (!arg) {
            throw new Error(`Can't resolve secret '${key}' from args`);
        }
        return arg.value as string;
    }
}

/**
 *  Based on code from automation-client. We don't want to depend on that
 *  project, so this duplication is OK.
 */
export function invokeCommandHandlerWithFreshParametersInstance<P>(h: HandleCommand<P>,
                                                                   md: CommandHandlerMetadata,
                                                                   params: P,
                                                                   args: Arg[],
                                                                   ctx: HandlerContext,
                                                                   mpr: MappedParameterResolver,
                                                                   secretResolver?: SecretResolver): Promise<HandlerResult> {
    populateParameters(params, md, args);
    populateMappedParameters(params, md, args, mpr);
    populateValues(params, md, {});
    const secretResolverToUse = secretResolver || new ArgsSecretResolver(args);
    populateSecrets(params, md, secretResolverToUse);

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
 * Populate parameters and mapped parameters of the command handler instance,
 * performing type coercion if necessary
 * @param instanceToPopulate parameters instance (may be handler instance itself)
 * @param hm handler metadata
 * @param args string args
 */
function populateParameters(instanceToPopulate: any,
                            hm: CommandHandlerMetadata,
                            args: Arg[]) {
    args.forEach(arg => {
        if (arg.value !== undefined) {
            const parameter = hm.parameters.find(p => p.name === arg.name);
            if (parameter) {
                _.update(instanceToPopulate, parameter.name, () => computeValue(parameter, arg.value));
            }
        }
    });

    const missingParams = hm.parameters
        .filter(p => p.required)
        .filter(p => _.get(instanceToPopulate, p.name) === undefined)
        .filter(param => !args.some(a => a.name === param.name));
    if (missingParams.length > 0) {
        throw new Error("Missing parameters: " + missingParams.map(p => p.name));
    }
}

function populateMappedParameters(instanceToPopulate: any,
                                  hm: CommandHandlerMetadata,
                                  args: Arg[],
                                  mpr: MappedParameterResolver) {
    hm.mapped_parameters.forEach(mp => {
        const matchingArg = args.find(arg => arg.name === mp.name);
        if (matchingArg) {
            _.update(instanceToPopulate, mp.name, () => computeValue(mp, matchingArg.value));
        } else {
            _.update(instanceToPopulate, mp.name, () => mpr.resolve(mp));
        }
    });

    const missingParams = hm.mapped_parameters
        .filter(p => p.required)
        .filter(p => _.get(instanceToPopulate, p.name) === undefined)
        .filter(param => !args.some(a => a.name === param.name));
    if (missingParams.length > 0) {
        throw new Error("Missing mapped parameters: " + missingParams.map(p => p.name));
    }
}

function populateSecrets(instanceToPopulate: any, hm: CommandHandlerMetadata, secretResolver: SecretResolver) {
    const secrets = hm.secrets || [];
    secrets.forEach(s => {
        _.update(instanceToPopulate, s.name, () => secretResolver.resolve(s.uri));
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

/* tslint:disable:cyclomatic-complexity */
function computeValue(parameter: { name: string, type?: ParameterType }, value: any) {
    let valueToUse = value;
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
            if (typeof valueToUse !== "boolean") {
                valueToUse = valueToUse === "true" || valueToUse === "yes" || valueToUse === "1";
            }
            break;
        case "number":
            if (typeof valueToUse === "string") {
                valueToUse = parseInt(valueToUse, 10);
            } else {
                throw new Error(`Parameter '${parameter.name}' has array value, but is numeric`);
            }
            break;
        default:
            // It's a Chooser
            const chooser = parameter.type;
            if (chooser.pickOne) {
                if (typeof valueToUse !== "string") {
                    throw new Error(`Parameter '${parameter.name}' has array value, but should be string`);
                }
            } else {
                if (typeof valueToUse.value === "string") {
                    throw new Error(`Parameter '${parameter.name}' has string value, but should be array`);
                }
            }
            break;
    }
    return valueToUse;
}
