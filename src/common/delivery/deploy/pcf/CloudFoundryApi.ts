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
    const usersUaa = new cfClient.UsersUAA;
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

    public stopApp(app_guid: string): Promise<AxiosResponse<any>> {
        return doWithRetry(() => axios.post(
            `${this.cf.api_url}/v3/apps/${app_guid}/actions/stop`,
            undefined,
            { headers: this.authHeader},
        ), `stop app ${app_guid}`);
    }

    public async startApp(app_guid: string): Promise<AxiosResponse<any>> {
        await doWithRetry(() => axios.post(
            `${this.cf.api_url}/v3/apps/${app_guid}/actions/start`,
            undefined,
            { headers: this.authHeader},
        ), `start app ${app_guid}`);
        return this.retryUntilCondition(
            () => this.getProcessStats(app_guid),
            r => _.every(r.data.resources, (p: any) => p.state === "RUNNING"),
        );
    }

    public async getApp(space_guid: string, app_name: string): Promise<any> {
        const apps = await this.cf.spaces.getSpaceApps(space_guid, {
            q: `name:${app_name}`,
        });
        return _.head(apps.resources);
    }

    public async createApp(space_guid: string, app_name: string): Promise<any> {
        const existing_app = await this.getApp(space_guid, app_name);
        return existing_app ? Promise.resolve(existing_app) : this.cf.apps.add({
            name: app_name,
            space_guid,
        });
    }

    public deleteApp(app_guid: string): Promise<AxiosResponse<any>> {
        return doWithRetry(() => axios.delete(
            `${this.cf.api_url}/v3/apps/${app_guid}`,
            { headers: this.authHeader},
        ), `delete app ${app_guid}`);
    }

    public getProcessStats(app_guid: string): Promise<AxiosResponse<any>> {
        return doWithRetry(() => axios.get(
            `${this.cf.api_url}/v3/processes/${app_guid}/stats`,
            { headers: this.authHeader},
        ), `get process stats ${app_guid}`);
    }

    public async uploadPackage(app_guid: string, packageFile: ReadStream): Promise<AxiosResponse<any>> {
        const packageCreateResult = await doWithRetry(() => axios.post(`${this.cf.api_url}/v3/packages`, {
            type: "bits",
            relationships: {
                app: {
                    data: {
                        guid: app_guid,
                    },
                },
            },
        }, {headers: _.assign({}, this.authHeader, this.jsonContentHeader)}),
            `create package ${app_guid}`);
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
        request(options, function(error, response, body) {
            if (error) { throw new Error(error); }
        });
        return this.retryUntilCondition(
            () => doWithRetry(() =>
                axios.get(packageCreateResult.data.links.self.href, { headers: this.authHeader}),
                `get package ${app_guid}`,
            ),
            r => r.data.state === "READY",
        );
    }

    public async buildDroplet(package_guid: string): Promise<AxiosResponse<any>> {
        const buildResult = await doWithRetry(() => axios.post(`${this.cf.api_url}/v3/builds`, {
                package: {
                    guid: package_guid,
                },
            },
            {headers: _.assign({}, this.authHeader, this.jsonContentHeader)}),
            `build droplet ${package_guid}`);
        return this.retryUntilCondition(
            () => doWithRetry(() =>
                axios.get(buildResult.data.links.self.href, {headers: this.authHeader}),
                `get build for package ${package_guid}`,
                ),
            r => r.data.state === "STAGED",
        );
    }

    public setCurrentDropletForApp(app_guid: string, droplet_guid: string): Promise<AxiosResponse<any>> {
        return doWithRetry(() => axios.patch(
            `${this.cf.api_url}/v3/apps/${app_guid}/relationships/current_droplet`,
            { data: { guid: droplet_guid } },
            { headers: _.assign({}, this.authHeader, this.jsonContentHeader)},
        ), `set current droplet for app ${app_guid}`);
    }

    public updateAppWithManifest(app_guid: string, manifest_app: ManifestApplication): Promise<any> {
        let memory: number;
        if (manifest_app.memory.endsWith("M")) {
            memory = +manifest_app.memory.replace("M", "");
        } else if (manifest_app.memory.endsWith("G")) {
            memory = +manifest_app.memory.replace("G", "") * 1000;
        }
        return this.cf.apps.update(app_guid, {
            memory,
            "instances": manifest_app.instances,
            "disk_quota": manifest_app.disk_quota,
            "command": manifest_app.command,
            "buildpack": manifest_app.buildpack,
            "health-check-type": manifest_app["health-check-type"],
            "health_check_timeout": manifest_app.timeout,
            "environment_json": manifest_app.env,
        });
    }

    public async getAppServiceBindings(app_guid: string): Promise<any[]> {
        const bindings = await this.cf.apps.getServiceBindings(app_guid);
        return bindings.resources;
    }

    public async getUserServices(): Promise<any[]> {
        const services = await this.cf.userProvidedServices.getServices();
        return services.resources;
    }

    public async addServices(app_guid: string, servicesToAdd: any[]): Promise<any> {
        return servicesToAdd.map(service => {
            this.cf.serviceBindings.associateServiceWithApp(service.metadata.guid, app_guid);
        });
    }

    public async removeServices(app_guid: string, serviceToRemove: any[]): Promise<any> {
        return serviceToRemove.forEach(service => {
            this.cf.apps.removeServiceBindings(app_guid, service.metadata.guid);
        });
    }

    public async addRouteToApp(space_guid: string, app_guid: string, hostName: string, domainName: string): Promise<any> {
        const domains = await this.cf.domains.getSharedDomains();
        const defaultDomain = domains.resources.find(d => d.entity.name === domainName);
        const domain_guid = defaultDomain.metadata.guid;
        const routesWithName = await this.cf.spaces.getSpaceRoutes(space_guid, {q: `host:${hostName}`});
        let route = routesWithName.resources.find(r => r.entity.domain_guid === domain_guid);
        if (!route) {
            route = await this.cf.routes.add({
                domain_guid,
                space_guid,
                host: hostName,
            });
        }
        return this.cf.apps.associateRoute(app_guid, route.metadata.guid);
    }

    public async getSpaceByName(space_name: string): Promise<any> {
        const spaces = await this.cf.spaces.getSpaces({q: `name:${space_name}`});
        return _.head(spaces.resources);
    }

}
