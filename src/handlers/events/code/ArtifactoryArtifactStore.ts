import { ArtifactStore, StoredArtifact } from "./ArtifactStore";
import { AppInfo } from "./DeploymentChain";
import { Stream } from "stream";

import * as fs from "fs";

var path = require("path");
var Q = require("Q");
var async = require("async");
var publisher = require("artifactory-publisher");

const artUrlBase = `https://sforzando.jfrog.io/sforzando/libs-release/artifactory`;

const options = {
    credentials: {
        username: "johnsonr",
        password: "WGzqnpPMvULiYVmbgjD7Evmq",
    },
    //proxy: ";http://localhost:8888" - to debug with Fiddler
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
}
