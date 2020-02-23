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
import {
    MutationNoCacheOptions,
    QueryNoCacheOptions,
} from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { PreferenceStoreFactory } from "../../../api/context/preferenceStore";
import {
    DeleteTeamConfiguration,
    SetTeamConfiguration,
    TeamConfigurationByNamespace,
} from "../../../typings/types";
import {
    AbstractPreferenceStore,
    Preference,
} from "./AbstractPreferenceStore";

/**
 * Factory to create a new TeamConfigurationPreferenceStore instance
 */
export const TeamConfigurationPreferenceStoreFactory: PreferenceStoreFactory =
    ctx => new TeamConfigurationPreferenceStore(ctx);

/**
 * PreferenceStore implementation that stores preferences in the backend GraphQL store.
 */
export class TeamConfigurationPreferenceStore extends AbstractPreferenceStore {

    constructor(private readonly context: HandlerContext) {
        super(context);
    }

    protected async doGet(name: string, namespace: string): Promise<Preference | undefined> {
        const result = await this.context.graphClient.query<TeamConfigurationByNamespace.Query, TeamConfigurationByNamespace.Variables>({
            name: "TeamConfigurationByNamespace",
            variables: {
                namespace: normalizeNamespace(namespace),
            },
            options: QueryNoCacheOptions,
        });
        const teamConfiguration = (result.TeamConfiguration || []).find(t => t.name === name);
        if (!!teamConfiguration) {
            return {
                name,
                namespace,
                value: teamConfiguration.value,
                ttl: undefined, // ttl is handled in the backend store
            };
        }
        return undefined;
    }

    protected async doPut(pref: Preference): Promise<void> {
        await this.context.graphClient.mutate<SetTeamConfiguration.Mutation, SetTeamConfiguration.Variables>({
            name: "SetTeamConfiguration",
            variables: {
                name: pref.name,
                namespace: normalizeNamespace(pref.namespace),
                value: pref.value,
                ttl: typeof pref.ttl === "number" ? Math.floor(pref.ttl / 1000) : undefined,
            },
            options: MutationNoCacheOptions,
        });
    }

    protected async doList(namespace: string): Promise<Preference[]> {
        const result = await this.context.graphClient.query<TeamConfigurationByNamespace.Query, TeamConfigurationByNamespace.Variables>({
            name: "TeamConfigurationByNamespace",
            variables: {
                namespace: normalizeNamespace(namespace),
            },
            options: QueryNoCacheOptions,
        });
        if (!!result.TeamConfiguration) {
            return result.TeamConfiguration.map(t => ({
                name: t.name,
                namespace: t.namespace,
                value: t.value,
                ttl: undefined,
            }));
        }
        return [];
    }

    protected async doDelete(name: string, namespace: string): Promise<void> {
        await this.context.graphClient.mutate<DeleteTeamConfiguration.Mutation, DeleteTeamConfiguration.Variables>({
            name: "DeleteTeamConfiguration",
            variables: {
                name,
                namespace: normalizeNamespace(namespace),
            },
            options: MutationNoCacheOptions,
        });
    }
}

function normalizeNamespace(namespace: string): string {
    if (!namespace || namespace.length === 0) {
        return "@atomist.global";
    }
    // Backend doesn't allow / inside a namespace
    return namespace.replace(/\//g, ".");
}
