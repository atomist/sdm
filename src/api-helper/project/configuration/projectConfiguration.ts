import { Project } from "@atomist/automation-client/project/Project";
import * as _ from "lodash";

export async function projectConfigurationValue<T>(path: string, p: Project, defaultValue?: T): Promise<T> {
    const cf = await p.getFile(".atomist/config.json");
    if (cf)  {
        const conf = JSON.parse(await cf.getContent());
        const value = _.get(conf, path) as T;
        if (value != null) {

            return value;
        } else if (defaultValue !== undefined) {
            return defaultValue;
        }

    } else if (defaultValue) {
        return defaultValue;
    }
    throw new Error(`Required project configuration value '${path}' not available`);
}
