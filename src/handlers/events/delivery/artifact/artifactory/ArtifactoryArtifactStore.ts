import { Stream } from "stream";
import { AppInfo } from "../../Deployment";

import * as fs from "fs";
import { ArtifactStore, DeployableArtifact, StoredArtifact } from "../../ArtifactStore";

const path = require("path");
const Q = require("Q");
const async = require("async");
const publisher = require("artifactory-publisher");

const artUrlBase = process.env.ARTIFACTORY_URL;

const options = {
    credentials: {
        username: process.env.ARTIFACTORY_USER,
        password: process.env.ARTIFACTORY_PASSWORD,
    },
};

export class ArtifactoryArtifactStore implements ArtifactStore {

    public store(appInfo: AppInfo, what: Stream): Promise<string> {
        return null;
    }

    public storeFile(appInfo: AppInfo, localFile: string): Promise<string> {
        const artUrl = `${artUrlBase}/test/${localFile}`;
        return publisher.publish(localFile, artUrl, options).then(() => {
            console.log("Published OK");
        });
    }

    public retrieve(url: string): Promise<StoredArtifact> {
        return null;
    }

    public checkout(url: string): Promise<DeployableArtifact> {
        return null;
    }
}
