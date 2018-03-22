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
    token_type: string;
    token: string;
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
    const cf = {
        api_url: cfi.api,
        token_type: token.token_type,
        token: token.access_token,
        apps: new cfClient.Apps(cfi.api),
        domains: new cfClient.Domains(cfi.api),
        spaces: new cfClient.Spaces(cfi.api),
        serviceBindings: new cfClient.ServiceBindings(cfi.api),
        userProvidedServices: new cfClient.UserProvidedServices(cfi.api),
        routes: new cfClient.Routes(cfi.api),
    };
    cf.apps.setToken(token);
    cf.domains.setToken(token);
    cf.spaces.setToken(token);
    cf.serviceBindings.setToken(token);
    cf.userProvidedServices.setToken(token);
    cf.routes.setToken(token);
    return cf;
}

/**
 * This abstracts away the details of common CF API operations.
 * The implementations use a mix of API versions and HTTP libs and will likely change.
 */
export class CloudFoundryApi {

    private authHeader;
    private jsonContentHeader = {
        "Content-Type": "application/json",
    };

    constructor(private cf: CloudFoundryClientV2,
                private retryInterval: number = 1000) {
        this.authHeader = {
            Authorization: `${cf.token_type} ${cf.token}`,
        };
    }

    private async retryUntilCondition<T>(action: () => Promise<T>, condition: (t: T) => boolean): Promise<T> {
        const result = await action();
        if (condition(result)) {
            return result;
        }
        await new Promise( res => setTimeout(res, this.retryInterval));
        return this.retryUntilCondition(action, condition);
    }

    public stopApp(appGuid: string): Promise<AxiosResponse<any>> {
        return doWithRetry(() => axios.post(
            `${this.cf.api_url}/v3/apps/${appGuid}/actions/stop`,
            undefined,
            { headers: this.authHeader},
        ), `stop app ${appGuid}`);
    }

    public async startApp(appGuid: string): Promise<AxiosResponse<any>> {
        await doWithRetry(() => axios.post(
            `${this.cf.api_url}/v3/apps/${appGuid}/actions/start`,
            undefined,
            { headers: this.authHeader},
        ), `start app ${appGuid}`);
        return this.retryUntilCondition(
            () => this.getProcessStats(appGuid),
            r => _.every(r.data.resources, (p: any) => p.state === "RUNNING"),
        );
    }

    public async getApp(spaceGuid: string, appName: string): Promise<any> {
        const apps = await this.cf.spaces.getSpaceApps(spaceGuid, {
            q: `name:${appName}`,
        });
        return _.head(apps.resources);
    }

    public async createApp(spaceGuid: string, appName: string): Promise<any> {
        const existingApp = await this.getApp(spaceGuid, appName);
        return existingApp ? Promise.resolve(existingApp) : this.cf.apps.add({
            name: appName,
            space_guid: spaceGuid,
        });
    }

    public deleteApp(appGuid: string): Promise<AxiosResponse<any>> {
        return doWithRetry(() => axios.delete(
            `${this.cf.api_url}/v3/apps/${appGuid}`,
            { headers: this.authHeader},
        ), `delete app ${appGuid}`);
    }

    public getProcessStats(appGuid: string): Promise<AxiosResponse<any>> {
        return doWithRetry(() => axios.get(
            `${this.cf.api_url}/v3/processes/${appGuid}/stats`,
            { headers: this.authHeader},
        ), `get process stats ${appGuid}`);
    }

    public async uploadPackage(appGuid: string, packageFile: ReadStream): Promise<AxiosResponse<any>> {
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
            () => doWithRetry(() =>
                axios.get(packageCreateResult.data.links.self.href, { headers: this.authHeader}),
                `get package ${appGuid}`,
            ),
            r => r.data.state === "READY",
        );
    }

    public async buildDroplet(packageGuid: string): Promise<AxiosResponse<any>> {
        const buildResult = await doWithRetry(() => axios.post(`${this.cf.api_url}/v3/builds`, {
                package: {
                    guid: packageGuid,
                },
            },
            {headers: _.assign({}, this.authHeader, this.jsonContentHeader)}),
            `build droplet ${packageGuid}`);
        return this.retryUntilCondition(
            () => doWithRetry(() =>
                axios.get(buildResult.data.links.self.href, {headers: this.authHeader}),
                `get build for package ${packageGuid}`,
                ),
            r => r.data.state === "STAGED",
        );
    }

    public setCurrentDropletForApp(appGuid: string, dropletGuid: string): Promise<AxiosResponse<any>> {
        return doWithRetry(() => axios.patch(
            `${this.cf.api_url}/v3/apps/${appGuid}/relationships/current_droplet`,
            { data: { guid: dropletGuid } },
            { headers: _.assign({}, this.authHeader, this.jsonContentHeader)},
        ), `set current droplet for app ${appGuid}`);
    }

    public updateAppWithManifest(appGuid: string, manifestApp: ManifestApplication): Promise<any> {
        let memory: number;
        if (manifestApp.memory.endsWith("M")) {
            memory = +manifestApp.memory.replace("M", "");
        } else if (manifestApp.memory.endsWith("G")) {
            memory = +manifestApp.memory.replace("G", "") * 1000;
        }
        return this.cf.apps.update(appGuid, {
            memory,
            "instances": manifestApp.instances,
            "disk_quota": manifestApp.disk_quota,
            "command": manifestApp.command,
            "buildpack": manifestApp.buildpack,
            "health-check-type": manifestApp["health-check-type"],
            "health_check_timeout": manifestApp.timeout,
            "environment_json": manifestApp.env,
        });
    }

    public async getAppServiceBindings(appGuid: string): Promise<any[]> {
        const bindings = await this.cf.apps.getServiceBindings(appGuid);
        return bindings.resources;
    }

    public async getUserServices(): Promise<any[]> {
        const services = await this.cf.userProvidedServices.getServices();
        return services.resources;
    }

    public async addServices(appGuid: string, servicesToAdd: any[]): Promise<any> {
        return servicesToAdd.map(service => {
            this.cf.serviceBindings.associateServiceWithApp(service.metadata.guid, appGuid);
        });
    }

    public async removeServices(appGuid: string, serviceToRemove: any[]): Promise<any> {
        return serviceToRemove.forEach(service => {
            this.cf.apps.removeServiceBindings(appGuid, service.metadata.guid);
        });
    }

    public async addRouteToApp(spaceGuid: string, appGuid: string, hostName: string, domainName: string): Promise<any> {
        const domains = await this.cf.domains.getSharedDomains();
        const defaultDomain = domains.resources.find(d => d.entity.name === domainName);
        const domainGuid = defaultDomain.metadata.guid;
        const routesWithName = await this.cf.spaces.getSpaceRoutes(spaceGuid, {q: `host:${hostName}`});
        let route = routesWithName.resources.find(r => r.entity.domain_guid === domainGuid);
        if (!route) {
            route = await this.cf.routes.add({
                domain_guid: domainGuid,
                space_guid: spaceGuid,
                host: hostName,
            });
        }
        return this.cf.apps.associateRoute(appGuid, route.metadata.guid);
    }

    public async getSpaceByName(spaceName: string): Promise<any> {
        const spaces = await this.cf.spaces.getSpaces({q: `name:${spaceName}`});
        return _.head(spaces.resources);
    }

}
