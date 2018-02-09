import { Stream } from "stream";
import { ArtifactStore, StoredArtifact } from "./ArtifactStore";
import { AppInfo } from "./Deployment";

import * as fs from "fs";

let path = require("path");
let Q = require("Q");
let async = require("async");
let publisher = require("artifactory-publisher");

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
