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
import { QueryNoCacheOptions } from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { addressEvent } from "@atomist/automation-client/lib/spi/message/MessageClient";
import { PreferenceStoreFactory } from "../../api/context/preferenceStore";
import { SdmPreferenceByKey } from "../../typings/types";
import {
    AbstractPreferenceStore,
    Preference,
} from "./AbstractPreferenceStore";

/**
 * Factory to create a new GraphQLPreferenceStore instance
 * @deprecated use TeamConfigurationPreferenceStoreFactory
 */
// tslint:disable-next-line:deprecation
export const GraphQLPreferenceStoreFactory: PreferenceStoreFactory = ctx => new GraphQLPreferenceStore(ctx);

/**
 * PreferenceStore implementation that stores preferences in the backend GraphQL store.
 * @deprecated use TeamConfigurationPreferenceStore
 */
export class GraphQLPreferenceStore extends AbstractPreferenceStore {

    constructor(private readonly context: HandlerContext) {
        super(context);
    }

    protected async doGet(name: string, namespace: string): Promise<Preference | undefined> {
        const key = this.scopeKey(name, namespace);
        const result = await this.context.graphClient.query<SdmPreferenceByKey.Query, SdmPreferenceByKey.Variables>({
            name: "SdmPreferenceByKey",
            variables: {
                key: [key],
            },
            options: QueryNoCacheOptions,
        });
        if (!!result.SdmPreference && result.SdmPreference.length === 1) {
            return {
                name,
                namespace,
                value: result.SdmPreference[0].value,
                ttl: result.SdmPreference[0].ttl,
            };
        }
        return undefined;
    }

    protected doPut(pref: Preference): Promise<void> {
        const key = this.scopeKey(pref.name, pref.namespace);
        return this.context.messageClient.send({
            key,
            value: pref.value,
            ttl: typeof pref.ttl === "number" ? Date.now() + pref.ttl : undefined,
        }, addressEvent("SdmPreference"));
    }

    protected async doList(namespace: string): Promise<Preference[]> {
        const result = await this.context.graphClient.query<SdmPreferenceByKey.Query, SdmPreferenceByKey.Variables>({
            name: "SdmPreferenceByKey",
            options: QueryNoCacheOptions,
        });
        if (!!result.SdmPreference) {
            return result.SdmPreference.filter(p => !namespace || p.key.startsWith(`${namespace}_$_`)).map(p => ({
                name: p.key.includes("_$_") ? p.key.split("_$_")[1] : p.key,
                namespace: p.key.includes("_$_") ? p.key.split("_$_")[0] : undefined,
                value: p.value,
                ttl: p.ttl,
            }));
        }
        return [];
    }

    protected async doDelete(name: string, namespace: string): Promise<void> {
        return this.doPut({ name, namespace, value: undefined, ttl: -100 });
    }

}
