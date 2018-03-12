import { logger } from "@atomist/automation-client";
import { ArtifactStore, DeployableArtifact, StoredArtifact } from "../../../spi/artifact/ArtifactStore";
import { AppInfo } from "../../../spi/deploy/Deployment";

/**
 * Store the artifact on local disk, relying on in memory cache.
 * This is purely for demo and test use. It is NOT a production
 * quality implementation. It uses misleading artifact links in
 * GitHub statuses that may not be honored after the present automation
 * client is shut down.
 */
export class EphemeralLocalArtifactStore implements ArtifactStore {

    private entries: Array<StoredArtifact & { url: string }> = [];

    public async storeFile(appInfo: AppInfo, what: string): Promise<string> {
        const entry = {
            appInfo,
            deploymentUnitUrl: "http://" + what,
            url: `http://${what}/x`,
        };
        this.entries.push(entry);
        logger.info("EphemeralLocalArtifactStore: storing %j at %s", appInfo, entry.url);
        return entry.url;
    }

    protected async retrieve(url: string): Promise<StoredArtifact> {
        return this.entries.find(e => e.url === url);
    }

    public async checkout(url: string): Promise<DeployableArtifact> {
        const storedArtifact = await this.retrieve(url);
        if (!storedArtifact) {
            logger.error("No stored artifact for [%s]: Known=%s", url,
                this.entries.map(e => e.url).join(","));
            return Promise.reject(new Error("No artifact found"));
        }

        const targetUrl = storedArtifact.deploymentUnitUrl;
        // Form is http:///var/folders/86/p817yp991bdddrqr_bdf20gh0000gp/T/tmp-20964EBUrRVIZ077a/target/losgatos1-0.1.0-SNAPSHOT.jar
        const lastSlash = targetUrl.lastIndexOf("/");
        const filename = targetUrl.substr(lastSlash + 1);
        const cwd = targetUrl.substring(7, lastSlash);
        const local: DeployableArtifact = {
            ...storedArtifact.appInfo,
            cwd,
            filename,
        };
        logger.info("EphemeralLocalArtifactStore: checking out %s at %j", url, local);
        return local;
    }
}
