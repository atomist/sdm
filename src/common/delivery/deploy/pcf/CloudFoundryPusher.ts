import * as _ from "lodash";

import {CloudFoundryApi} from "./CloudFoundryApi";
import {ReadStream} from "fs";
import {ProgressLog} from "../../../../spi/log/ProgressLog";
import {ManifestApplication} from "./CloudFoundryManifest";
import {CloudFoundryDeployment} from "./CloudFoundryTarget";

export interface ServicesModifications {
    servicesToAdd: any[];
    servicesToRemove: any[];
}

export class CloudFoundryPusher {

    constructor(private api: CloudFoundryApi, private defaultDomain: string = "cfapps.io") {}

    public async push(space_name: string, manifest_app: ManifestApplication, packageFile: ReadStream, log: ProgressLog): Promise<CloudFoundryDeployment> {
        const space = await this.api.getSpaceByName(space_name);
        const space_guid = space.metadata.guid;
        const app = await this.api.createApp(space_guid, manifest_app.name);
        const app_guid = app.metadata.guid;
        const appNameForLog = `${space_name}:${manifest_app.name}`;
        log.write(`Uploading package for ${appNameForLog}...`);
        const packageUploadResult = await this.api.uploadPackage(app_guid, packageFile);
        log.write(`Building package for ${appNameForLog}...`);
        const buildResult = await this.api.buildDroplet(packageUploadResult.data.guid);
        const serviceModifications = await this.appServiceModifications(app_guid, manifest_app.services);
        await this.api.stopApp(app_guid);
        log.write(`Stopped and updating ${appNameForLog}.`);
        const appModificationPromises = [];
        appModificationPromises.push(this.api.setCurrentDropletForApp(app_guid, buildResult.data.droplet.guid));
        appModificationPromises.push(this.api.addServices(app_guid, serviceModifications.servicesToAdd));
        appModificationPromises.push(this.api.removeServices(app_guid, serviceModifications.servicesToRemove));
        if (!manifest_app["no-route"]) {
            appModificationPromises.push(this.api.addRouteToApp(space_guid, app_guid, manifest_app.name, this.defaultDomain));
        }
        appModificationPromises.push(this.api.updateAppWithManifest(app_guid, manifest_app));
        await Promise.all(appModificationPromises);
        log.write(`Starting ${appNameForLog}...`);
        this.api.startApp(app_guid);
        log.write(`Push complete for ${appNameForLog}.`);
        return {
            endpoint: this.constructEndpoint(manifest_app.name),
            appName: manifest_app.name,
        }
    }

    public constructEndpoint(appName: string): string {
        return `https://${appName}.${this.defaultDomain}`
    }

    public async appServiceModifications(app_guid: string, serviceNames: string[]): Promise<ServicesModifications> {
        const services = await this.api.getUserServices();
        const specifiedServices: any[] = serviceNames.map(serviceName => {
            return services.find(s => s.entity.name === serviceName);
        });
        const existingServiceBindings = await this.api.getAppServiceBindings(app_guid);
        const existingServiceBindingGuids = existingServiceBindings
            .map(esb => esb.entity.service_instance_guid);
        const servicesToAdd = _.filter(specifiedServices, service => {
            return !_.includes(existingServiceBindingGuids, service.metadata.guid);
        });
        const specifiedServiceGuids = specifiedServices.map(s => s.metadata.guid);
        const servicesToRemove = _.filter(existingServiceBindings, (service: any) => {
            return !_.includes(specifiedServiceGuids, service.entity.service_instance_guid);
        });
        return {
            servicesToAdd,
            servicesToRemove,
        };
    }
}