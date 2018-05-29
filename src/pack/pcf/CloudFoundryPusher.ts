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

import * as _ from "lodash";

import {ReadStream} from "fs";
import randomWord = require("random-word");
import {ProgressLog} from "../../spi/log/ProgressLog";
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

    private spaceGuid: string;

    constructor(private readonly api: CloudFoundryApi,
                public readonly spaceName: string,
                public readonly defaultDomain: string = "cfapps.io") {

    }

    public async getSpaceGuid(): Promise<string> {
        if (!this.spaceGuid) {
            const space = await this.api.getSpaceByName(this.spaceName);
            this.spaceGuid = space.metadata.guid;
        }
        return this.spaceGuid;
    }

    public async push(manifestApp: ManifestApplication,
                      packageFile: ReadStream,
                      log: ProgressLog): Promise<CloudFoundryDeployment> {
        const spaceGuid = await this.getSpaceGuid();
        const existingApp = await this.api.getApp(spaceGuid, manifestApp.name);
        const app = existingApp ? existingApp : await this.api.createApp(spaceGuid, manifestApp);
        const appGuid = app.metadata.guid;
        const appNameForLog = `${this.spaceName}:${manifestApp.name}`;
        log.write(`Uploading package for ${appNameForLog}...`);
        // tslint:disable-next-line:no-floating-promises
        log.flush();
        const packageUploadResult = await this.api.uploadPackage(appGuid, packageFile);
        log.write(`Building package for ${appNameForLog}...`);
        // tslint:disable-next-line:no-floating-promises
        log.flush();
        const buildResult = await this.api.buildDroplet(packageUploadResult.data.guid);
        const serviceNames = !manifestApp.services ? [] : manifestApp.services;
        const serviceModifications = await this.appServiceModifications(appGuid, serviceNames);
        await this.api.stopApp(appGuid);
        log.write(`Stopped app for updates to ${appNameForLog}.`);
        await this.api.setCurrentDropletForApp(appGuid, buildResult.data.droplet.guid);
        if (serviceModifications.servicesToAdd.length > 0) {
            const addServiceNames = serviceModifications.servicesToAdd.map(s => s.entity.name);
            log.write(`Adding services ${addServiceNames} to ${appNameForLog}.`);
            await this.api.addServices(appGuid, serviceModifications.servicesToAdd);
        }
        if (serviceModifications.servicesToRemove.length > 0) {
            const removeServiceNames = serviceModifications.servicesToRemove.map(s => s.entity.name);
            log.write(`Removing services ${removeServiceNames} from ${appNameForLog}.`);
            await this.api.removeServices(appGuid, serviceModifications.servicesToRemove);
        }

        let hostName;
        if (manifestApp["random-route"]) {
            const appRoutes = await this.api.getAppRoutes(appGuid);
            if (appRoutes.length === 0) {
                hostName = `${manifestApp.name}-${randomWord()}-${randomWord()}`;
                log.write(`Adding random route to ${appNameForLog}.`);
                const domain = await this.api.getDomain(this.defaultDomain);
                const domainGuid = domain.metadata.guid;
                await this.api.addRouteToApp(spaceGuid, appGuid, hostName, domainGuid);
            } else {
                hostName = appRoutes[0].entity.host;
            }
        }

        log.write(`Updating app with manifest ${appNameForLog}.`);
        await this.api.updateAppWithManifest(appGuid, manifestApp);
        log.write(`Starting ${appNameForLog}...`);
        // tslint:disable-next-line:no-floating-promises
        log.flush();
        await this.api.startApp(appGuid);
        log.write(`Push complete for ${appNameForLog}.`);
        // tslint:disable-next-line:no-floating-promises
        log.flush();
        return {
            endpoint: !!hostName ? this.constructEndpoint(hostName) : undefined,
            appName: manifestApp.name,
        };
    }

    public constructEndpoint(hostName: string): string {
        return `https://${hostName}.${this.defaultDomain}`;
    }

    public async appServiceModifications(appGuid: string, serviceNames: string[]): Promise<ServicesModifications> {
        const services = await this.api.getUserServices();
        const specifiedServices: any[] = serviceNames.map(serviceName => {
            return services.find(s => s.entity.name === serviceName);
        });
        const existingServiceBindings = await this.api.getAppServiceBindings(appGuid);
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
