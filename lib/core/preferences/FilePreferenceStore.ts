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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as os from "os";
import * as path from "path";
import {
    lock,
    unlock,
} from "proper-lockfile";
import { PreferenceStoreFactory } from "../../api/context/preferenceStore";
import {
    AbstractPreferenceStore,
    Preference,
} from "./AbstractPreferenceStore";

type PreferenceFile = Record<string, { name: string, value: string, ttl?: number }>;

type WithPreferenceFile<V> = (p: PreferenceFile) => Promise<{ value?: V, save: boolean }>;

/**
 * Factory to create a new FilePreferenceStore instance
 */
export const FilePreferenceStoreFactory: PreferenceStoreFactory = ctx => new FilePreferenceStore(ctx);

/**
 * PreferenceStore implementation that stores preferences in a shared file.
 * Note: this implementation attempts to lock the preference file before reading or writing to it
 * but it is not intended for production usage.
 */
export class FilePreferenceStore extends AbstractPreferenceStore {

    constructor(context: HandlerContext,
                private readonly filePath: string = path.join(os.homedir(), ".atomist", "prefs", "client.prefs.json")) {
        super(context);
        this.init();
    }

    protected async doGet(name: string, namespace: string): Promise<Preference | undefined> {
        const key = this.scopeKey(name, namespace);
        return this.doWithPreferenceFile<Preference | undefined>(async prefs => {
            if (!!prefs[key]) {
                return {
                    save: false,
                    value: {
                        name,
                        namespace,
                        value: prefs[key].value,
                        ttl: prefs[key].ttl,
                    },
                };
            } else {
                return {
                    save: false,
                    value: undefined,
                };
            }
        });
    }

    protected async doPut(pref: Preference): Promise<void> {
        return this.doWithPreferenceFile<void>(async prefs => {
            const key = this.scopeKey(pref.name, pref.namespace);
            prefs[key] = {
                name: pref.name,
                value: pref.value,
                ttl: typeof pref.ttl === "number" ? Date.now() + pref.ttl : undefined,
            };
            return {
                save: true,
            };
        });
    }

    protected doList(namespace: string): Promise<Preference[]> {
        return this.doWithPreferenceFile<Preference[]>(async prefs => {
            const values: Preference[] = [];
            _.forEach(prefs, (v, k) => {
                if (!namespace || k.startsWith(`${namespace}_$_`)) {
                    values.push(v as Preference);
                }
            });
            return {
                save: false,
                value: values,
            };
        });
    }

    protected doDelete(pref: string, namespace: string): Promise<void> {
        return this.doWithPreferenceFile<void>(async prefs => {
            const key = this.scopeKey(pref, namespace);
            delete prefs[key];
            return {
                save: true,
            };
        });
    }

    private async read(): Promise<PreferenceFile> {
        return (await fs.readJson(this.filePath)) as PreferenceFile;
    }

    private async doWithPreferenceFile<V>(withPreferenceFile: WithPreferenceFile<V>): Promise<V> {
        await lock(this.filePath, { retries: 5 });
        const prefs = await this.read();
        let result;
        try {
            result = await withPreferenceFile(prefs);
            if (result.save) {
                await fs.writeJson(this.filePath, prefs);
            }
        } catch (e) {
            logger.error(`Operation on preference file failed: ${e.message}`);
        }
        await unlock(this.filePath);
        return result.value as V;
    }

    private init(): void {
        fs.ensureDirSync(path.dirname(this.filePath));
        try {
            fs.readFileSync(this.filePath);
        } catch (e) {
            fs.writeJsonSync(this.filePath, {});
        }
    }

}
