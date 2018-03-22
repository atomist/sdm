import * as _ from "lodash";

import {ReadStream} from "fs";
import {ProgressLog} from "../../../../spi/log/ProgressLog";
import {CloudFoundryApi} from "./CloudFoundryApi";
import {ManifestApplication} from "./CloudFoundryManifest";
import {CloudFoundryDeployment} from "./CloudFoundryTarget";

export interface ServicesModifications {
    servicesToAdd: any[];
    servicesToRemove: any[];
}

/**
 * Uses the Cloud Foundry API to (mostly) reimplement their CLI push.
 * It supports using the manifest, but not all attributes.
 * It currently attaches a default route rather than the routes specified in the manifest.
 * This is separate from the deployer so that the API could easily be mocked for testing.
 */
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
        log.write(`Stopped app for updates to ${appNameForLog}.`);
        await this.api.setCurrentDropletForApp(app_guid, buildResult.data.droplet.guid);
        if (serviceModifications.servicesToAdd.length > 0) {
            const addServiceNames = serviceModifications.servicesToAdd.map(s => s.entity.name);
            log.write(`Adding services ${addServiceNames} to ${appNameForLog}.`);
            await this.api.addServices(app_guid, serviceModifications.servicesToAdd);
        }
        if (serviceModifications.servicesToRemove.length > 0) {
            const removeServiceNames = serviceModifications.servicesToRemove.map(s => s.entity.name);
            log.write(`Removing services ${removeServiceNames} from ${appNameForLog}.`);
            await this.api.removeServices(app_guid, serviceModifications.servicesToRemove);
        }
        log.write(`Adding default route to ${appNameForLog}.`);
        await this.api.addRouteToApp(space_guid, app_guid, manifest_app.name, this.defaultDomain);
        log.write(`Updating app with manifest ${appNameForLog}.`);
        await this.api.updateAppWithManifest(app_guid, manifest_app);
        log.write(`Starting ${appNameForLog}...`);
        await this.api.startApp(app_guid);
        log.write(`Push complete for ${appNameForLog}.`);
        return {
            endpoint: this.constructEndpoint(manifest_app.name),
            appName: manifest_app.name,
        };
    }

    public constructEndpoint(appName: string): string {
        return `https://${appName}.${this.defaultDomain}`;
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
