import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";

export interface SkillContext {
    configuration?: SkillConfiguration;
}

export interface SkillConfiguration {
    name: string,
    parameters: Record<string, any>;
}

export function createSkillContext(ctx: HandlerContext): SkillContext {
    const configuration = (ctx as any)?.trigger?.configuration;
    if (!!configuration) {
        const parameters = {};
        (configuration.parameters || []).forEach(p => parameters[p.name] = p.value);
        return {
            configuration: {
                name: configuration.name,
                parameters,
            }
        }
    }
    return {};
}
