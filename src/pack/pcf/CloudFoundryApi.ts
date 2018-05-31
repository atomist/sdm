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

import { CloudFoundryInfo } from "./CloudFoundryTarget";

import { AxiosResponse } from "axios";

import axios from "axios";
import FormData = require("form-data");
import {ReadStream} from "fs";
import * as _ from "lodash";
import request = require("request");
import {ManifestApplication} from "./CloudFoundryManifest";

import {doWithRetry} from "@atomist/automation-client/util/retry";
import cfClient = require("cf-client");

export interface CloudFoundryClientV2 {
    api_url: string;
    token: any;
    usersUaa: any;
    apps: any;
    domains: any;
    spaces: any;
    serviceBindings: any;
    userProvidedServices: any;
    routes: any;
}

export async function initializeCloudFoundry(cfi: CloudFoundryInfo): Promise<CloudFoundryClientV2> {
    const cloudController = new cfClient.CloudController(cfi.api);
    const endpoint = await cloudController.getInfo();
    const usersUaa = new cfClient.UsersUAA();
    usersUaa.setEndPoint(endpoint.authorization_endpoint);
    const token = await usersUaa.login(cfi.username, cfi.password);
    usersUaa.setToken(token);
    const cf = {
        api_url: cfi.api,
        token,
        usersUaa,
        apps: new cfClient.Apps(cfi.api),
        domains: new cfClient.Domains(cfi.api),
        spaces: new cfClient.Spaces(cfi.api),
        serviceBindings: new cfClient.ServiceBindings(cfi.api),
        userProvidedServices: new cfClient.UserProvidedServices(cfi.api),
        routes: new cfClient.Routes(cfi.api),
    };
    return cf;
}

/**
 * This abstracts away the details of common CF API operations.
 * The implementations use a mix of API versions and HTTP libs and will likely change.
 */
export class CloudFoundryApi {

    private authHeader;
    private readonly jsonContentHeader = {
        "Content-Type": "application/json",
    };

    constructor(private readonly cf: CloudFoundryClientV2,
                private readonly retryInterval: number = 1000) {
    }

    private async refreshToken() {
        const newToken = await this.cf.usersUaa.refreshToken();
        this.cf.token = newToken;
        this.authHeader = {
            Authorization: `${newToken.token_type} ${newToken.access_token}`,
        };
        this.cf.usersUaa.setToken(newToken);
        this.cf.apps.setToken(newToken);
        this.cf.domains.setToken(newToken);
        this.cf.spaces.setToken(newToken);
        this.cf.serviceBindings.setToken(newToken);
        this.cf.userProvidedServices.setToken(newToken);
        this.cf.routes.setToken(newToken);
    }

    private async retryUntilCondition(action: () => Promise<AxiosResponse>,
                                      successCondition: (r: AxiosResponse) => boolean,
                                      failureCondition: (r: AxiosResponse) => boolean): Promise<AxiosResponse> {
        const result = await action();
        if (successCondition(result)) {
            return result;
        }
        if (failureCondition(result)) {
            const error = new Error(JSON.stringify(result.data));
            error.name = "RetryUntilConditionFailure";
            throw error;
        }
        await new Promise<AxiosResponse>(res => setTimeout(res, this.retryInterval));
        return this.retryUntilCondition(action, successCondition, failureCondition);
    }

    public async stopApp(appGuid: string): Promise<AxiosResponse<any>> {
        await this.refreshToken();
        return doWithRetry(() => axios.post(
            `${this.cf.api_url}/v3/apps/${appGuid}/actions/stop`,
            undefined,
            { headers: this.authHeader},
        ), `stop app ${appGuid}`);
    }

    public async startApp(appGuid: string): Promise<AxiosResponse<any>> {
        await this.refreshToken();
        await doWithRetry(() => axios.post(
            `${this.cf.api_url}/v3/apps/${appGuid}/actions/start`,
            undefined,
            { headers: this.authHeader},
        ), `start app ${appGuid}`);
        return this.retryUntilCondition(
            async () => {
                await this.refreshToken();
                return this.getProcessStats(appGuid);
            },
            r => _.every(r.data.resources, (p: any) => p.state === "RUNNING"),
            r => _.every(r.data.resources, (p: any) => p.state === "CRASHED"),
        );
    }

    public async getApp(spaceGuid: string, appName: string): Promise<any> {
        await this.refreshToken();
        const apps = await this.cf.spaces.getSpaceApps(spaceGuid, {
            q: `name:${appName}`,
        });
        return _.head(apps.resources);
    }

    public async createApp(spaceGuid: string, manifestApp: ManifestApplication): Promise<any> {
        await this.refreshToken();
        return this.cf.apps.add({
            "name": manifestApp.name,
            "space_guid": spaceGuid,
            "memory": this.normalizeManifestMemory(manifestApp.memory),
            "instances": manifestApp.instances,
            "disk_quota": manifestApp.disk_quota,
            "command": manifestApp.command,
            "buildpack": manifestApp.buildpack,
            "health-check-type": manifestApp["health-check-type"],
            "health_check_timeout": manifestApp.timeout,
            "environment_json": manifestApp.env,
        });
    }

    public async updateAppWithManifest(appGuid: string, manifestApp: ManifestApplication): Promise<any> {
        await this.refreshToken();
        return this.cf.apps.update(appGuid, {
            "memory": this.normalizeManifestMemory(manifestApp.memory),
            "instances": manifestApp.instances,
            "disk_quota": manifestApp.disk_quota,
            "command": manifestApp.command,
            "buildpack": manifestApp.buildpack,
            "health-check-type": manifestApp["health-check-type"],
            "health_check_timeout": manifestApp.timeout,
            "environment_json": manifestApp.env,
        });
    }

    public async renameApp(appGuid: string, appName: string): Promise<any> {
        await this.refreshToken();
        return doWithRetry(() => axios.patch(
            `${this.cf.api_url}/v3/apps/${appGuid}`,
            {
                name: appName,
            },
            {headers: _.assign({}, this.authHeader, this.jsonContentHeader)},
        ), `rename app ${appGuid} to ${appName}`);
    }

    private normalizeManifestMemory(memory: string): number {
        if (memory.endsWith("M")) {
            return +memory.replace("M", "");
        } else if (memory.endsWith("G")) {
            return +memory.replace("G", "") * 1000;
        }
    }

    public async deleteApp(appGuid: string): Promise<AxiosResponse<any>> {
        await this.refreshToken();
        return doWithRetry(() => axios.delete(
            `${this.cf.api_url}/v3/apps/${appGuid}`,
            { headers: this.authHeader},
        ), `delete app ${appGuid}`);
    }

    public async getProcessStats(appGuid: string): Promise<AxiosResponse<any>> {
        await this.refreshToken();
        return doWithRetry(() => axios.get(
            `${this.cf.api_url}/v3/processes/${appGuid}/stats`,
            { headers: this.authHeader},
        ), `get process stats ${appGuid}`);
    }

    public async uploadPackage(appGuid: string, packageFile: ReadStream): Promise<AxiosResponse<any>> {
        await this.refreshToken();
        const packageCreateResult = await doWithRetry(() => axios.post(`${this.cf.api_url}/v3/packages`, {
            type: "bits",
            relationships: {
                app: {
                    data: {
                        guid: appGuid,
                    },
                },
            },
        }, {headers: _.assign({}, this.authHeader, this.jsonContentHeader)}),
            `create package ${appGuid}`);
        const formData = FormData();
        formData.maxDataSize = Infinity;
        formData.append("bits", packageFile);
        const uploadHeaders = _.assign({}, this.authHeader, formData.getHeaders());
        const options = {
            method: "POST",
            url: packageCreateResult.data.links.upload.href,
            headers: uploadHeaders,
            formData:
                {
                    bits: packageFile,
                },
        };
        request(options, (error, response, body) => {
            if (error) { throw new Error(error); }
        });
        return this.retryUntilCondition(
            async () => {
                await this.refreshToken();
                return doWithRetry(() =>
                        axios.get(packageCreateResult.data.links.self.href, { headers: this.authHeader}),
                    `get package ${packageCreateResult.data.guid}`);
            },
            r => r.data.state === "READY",
            r => r.data.state === "FAILED",
        );
    }

    public async buildDroplet(packageGuid: string): Promise<AxiosResponse<any>> {
        await this.refreshToken();
        const buildResult = await doWithRetry(() => axios.post(`${this.cf.api_url}/v3/builds`, {
                package: {
                    guid: packageGuid,
                },
            },
            {headers: _.assign({}, this.authHeader, this.jsonContentHeader)}),
            `build droplet ${packageGuid}`);
        return this.retryUntilCondition(
            async () => {
                await this.refreshToken();
                return doWithRetry(() => axios.get(buildResult.data.links.self.href, {headers: this.authHeader}),
                    `get build for package ${buildResult.data.guid}`);
                },
                r => r.data.state === "STAGED",
            r => r.data.state === "FAILED" || r.data.state === "EXPIRED",
        );
    }

    public async setCurrentDropletForApp(appGuid: string, dropletGuid: string): Promise<AxiosResponse<any>> {
        await this.refreshToken();
        return doWithRetry(() => axios.patch(
            `${this.cf.api_url}/v3/apps/${appGuid}/relationships/current_droplet`,
            { data: { guid: dropletGuid } },
            { headers: _.assign({}, this.authHeader, this.jsonContentHeader)},
        ), `set current droplet for app ${appGuid}`);
    }

    public async getAppServiceBindings(appGuid: string): Promise<any[]> {
        await this.refreshToken();
        const bindings = await this.cf.apps.getServiceBindings(appGuid);
        return bindings.resources;
    }

    public async getUserServices(): Promise<any[]> {
        await this.refreshToken();
        const services = await this.cf.userProvidedServices.getServices();
        return services.resources;
    }

    public async addServices(appGuid: string, servicesToAdd: any[]): Promise<any> {
        await this.refreshToken();
        return servicesToAdd.map(service => {
            this.cf.serviceBindings.associateServiceWithApp(service.metadata.guid, appGuid);
        });
    }

    public async removeServices(appGuid: string, serviceToRemove: any[]): Promise<any> {
        await this.refreshToken();
        return serviceToRemove.forEach(service => {
            this.cf.apps.removeServiceBindings(appGuid, service.metadata.guid);
        });
    }

    public async getAppRoutes(appGuid: string): Promise<any> {
        await this.refreshToken();
        const result = await this.cf.apps.getAppRoutes(appGuid);
        return result.resources;
    }

    public async addRouteToApp(spaceGuid: string, appGuid: string, hostName: string, domainGuid: string): Promise<any> {
        await this.refreshToken();
        const routesMatchingHost = await this.cf.routes.getRoutes({q: `host:${hostName}`});
        const existingRoute = routesMatchingHost.resources.find(r =>
            r.entity.domain_guid === domainGuid && r.entity.space_guid === spaceGuid);
        const route = existingRoute ? existingRoute : await this.cf.routes.add({
            domain_guid: domainGuid,
            space_guid: spaceGuid,
            host: hostName,
        });
        return this.cf.apps.associateRoute(appGuid, route.metadata.guid);
    }

    public async getDomain(domainName: string): Promise<any> {
        await this.refreshToken();
        const domains = await this.cf.domains.getSharedDomains();
        return domains.resources.find(d => d.entity.name === domainName);
    }

    public async getDomainByGuid(domainGuid: string): Promise<any> {
        await this.refreshToken();
        const domains = await this.cf.domains.getSharedDomains();
        return domains.resources.find(d => d.metadata.guid === domainGuid);
    }

    public async removeRouteFromApp(spaceGuid: string, appGuid: string, hostName: string, domainName: string): Promise<any> {
        await this.refreshToken();
        const appRoutes = await this.getAppRoutes(appGuid);
        const domains = await this.cf.domains.getSharedDomains();
        const domain = domains.resources.find(d => d.entity.name === domainName);
        const domainGuid = domain.metadata.guid;
        const existingRoute = appRoutes.find(r =>
            r.entity.host === hostName && r.entity.domain_guid === domainGuid && r.entity.space_guid === spaceGuid);
        if (existingRoute) {
            return this.cf.apps.dissociateRoute(appGuid, existingRoute.metadata.guid);
        }
        return undefined;
    }

    public async getSpaceByName(spaceName: string): Promise<any> {
        await this.refreshToken();
        const spaces = await this.cf.spaces.getSpaces({q: `name:${spaceName}`});
        return _.head(spaces.resources);
    }

}
