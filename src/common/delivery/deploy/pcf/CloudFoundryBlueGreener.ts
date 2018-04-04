
import * as _ from "lodash";

import {ReadStream} from "fs";
import {ProgressLog} from "../../../../spi/log/ProgressLog";
import {CloudFoundryApi} from "./CloudFoundryApi";
import {ManifestApplication} from "./CloudFoundryManifest";
import {CloudFoundryPusher} from "./CloudFoundryPusher";
import {CloudFoundryDeployment} from "./CloudFoundryTarget";

export class BlueGreenNamer {
    constructor(private currentAppName: string) {
    }

    public getCurrentAppName() {
        return `${this.currentAppName}`;
    }

    public getPreviousAppName() {
        return `${this.currentAppName}-old`;
    }

    public getNextAppName() {
        return `${this.currentAppName}-new`;
    }
}

export class CloudFoundryBlueGreener {

    constructor(private cfApi: CloudFoundryApi,
                private pusher: CloudFoundryPusher,
                private namer: BlueGreenNamer,
                private log: ProgressLog) {
    }

    public async cleanUpExistingBlueGreenApps() {
        const spaceGuid = await this.pusher.getSpaceGuid();
        const previousApp = await this.cfApi.getApp(spaceGuid, this.namer.getPreviousAppName());
        if (previousApp) {
            this.log.write(`Removing app ${this.pusher.spaceName}:${this.namer.getPreviousAppName()}.`);
            await this.cfApi.deleteApp(previousApp.metadata.guid);
        }
        const nextApp = await this.cfApi.getApp(spaceGuid, this.namer.getNextAppName());
        if (nextApp) {
            await this.cfApi.deleteApp(nextApp.metadata.guid);
            this.log.write(`Removing app ${this.pusher.spaceName}:${this.namer.getNextAppName()}.`);
        }
    }

    public async createNextAppWithRoutes(manifestApp: ManifestApplication,
                                         packageFile: ReadStream): Promise<CloudFoundryDeployment> {
        const spaceGuid = await this.pusher.getSpaceGuid();
        const appProperties = _.assign({}, manifestApp);
        const currentApp = await this.cfApi.getApp(spaceGuid, this.namer.getCurrentAppName());
        let currentRoutes = [];
        if (currentApp) {
            appProperties.name = this.namer.getNextAppName();
            currentRoutes = await this.cfApi.getAppRoutes(currentApp.metadata.guid);
        }
        if (currentRoutes.length === 0) {
            appProperties["random-route"] = true;
        }
        this.log.write(`Creating app ${this.pusher.spaceName}:${appProperties.name}.`);
        const deployment = await this.pusher.push(appProperties, packageFile, this.log);
        if (currentRoutes.length > 0) {
            this.log.write(`Adding routes to app ${this.pusher.spaceName}:${appProperties.name}.`);
            const nextApp = await this.cfApi.getApp(spaceGuid, appProperties.name);
            const domain = this.pusher.defaultDomain;
            currentRoutes.forEach(async route => {
                await this.cfApi.addRouteToApp(spaceGuid, nextApp.metadata.guid, route.entity.host, domain);
            });
            const anyRoute = currentRoutes[0];
            const endpoint = `https://${anyRoute.entity.host}.${anyRoute.entity.domain}`;
            return _.assign({}, deployment, {endpoint});
        }
        return deployment;
    }

    public async retireCurrentApp() {
        const spaceGuid = await this.pusher.getSpaceGuid();
        const nextApp = await this.cfApi.getApp(spaceGuid, this.namer.getNextAppName());
        if (!nextApp) {
            return;
        }
        const currentApp = await this.cfApi.getApp(spaceGuid, this.namer.getCurrentAppName());
        if (!currentApp) {
            return;
        }
        const currentRoutes = await this.cfApi.getAppRoutes(currentApp.metadata.guid);
        if (currentRoutes.length > 0) {
            this.log.write(`Removing routes from app ${this.pusher.spaceName}:${this.namer.getNextAppName()}.`);
            const domain = this.pusher.defaultDomain;
            currentRoutes.forEach(async route => {
                await this.cfApi.removeRouteFromApp(spaceGuid, currentApp.metadata.guid, route.entity.host, domain);
            });
        }
        this.log.write(`Renaming app ${this.pusher.spaceName}:${this.namer.getCurrentAppName()} `
            + `to ${this.namer.getPreviousAppName()}.`);
        await this.cfApi.renameApp(currentApp.metadata.guid, this.namer.getPreviousAppName());
        this.log.write(`Stopping app ${this.pusher.spaceName}:${this.namer.getPreviousAppName()}.`);
        await this.cfApi.stopApp(currentApp.metadata.guid);
        this.log.write(`Renaming app ${this.pusher.spaceName}:${this.namer.getNextAppName()} `
            + `to ${this.namer.getCurrentAppName()}.`);
        await this.cfApi.renameApp(nextApp.metadata.guid, this.namer.getCurrentAppName());
        return nextApp;
    }

}
