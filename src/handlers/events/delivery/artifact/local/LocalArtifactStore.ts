import { logger } from "@atomist/automation-client";
import * as Stream from "stream";
import { ArtifactStore, DeployableArtifact, StoredArtifact } from "../../ArtifactStore";
import { AppInfo } from "../../deploy/Deployment";

/**
 * Store the artifact on local disk, relying on in memory cache
 */
export class LocalArtifactStore implements ArtifactStore {

    private entries: Array<StoredArtifact & { url: string }> = [];

    public store(appInfo: AppInfo, what: Stream): Promise<string> {
        console.log("Storing " + JSON.stringify(appInfo));
        throw new Error("not yet supported");
    }

    public storeFile(appInfo: AppInfo, what: string): Promise<string> {
        console.log("Storing " + JSON.stringify(appInfo));
        const entry = {
            appInfo,
            deploymentUnitUrl: "http://" + what,
            url: `http://${what}/x`,
        };
        this.entries.push(entry);
        return Promise.resolve(entry.url);
    }

    protected retrieve(url: string): Promise<StoredArtifact> {
        return Promise.resolve(this.entries.find(e => e.url === url));
    }

    public checkout(url: string): Promise<DeployableArtifact> {
        return this.retrieve(url)
            .then(storedArtifact => {
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
                return Promise.resolve(local);
            });
    }
}
