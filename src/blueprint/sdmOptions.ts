import { Configuration } from "@atomist/automation-client";
import * as _ from "lodash";
import { GitHubCredentialsResolver } from "../handlers/common/GitHubCredentialsResolver";
import {
    CachingProjectLoader,
    EphemeralLocalArtifactStore,
} from "../index";
import { logFactory } from "../spi/log/logFactory";
import { SoftwareDeliveryMachineOptions } from "./SoftwareDeliveryMachineOptions";

export function softwareDeliveryMachineOptions(configuration: Configuration): SoftwareDeliveryMachineOptions {
    return {
        artifactStore: new EphemeralLocalArtifactStore(),
        projectLoader: new CachingProjectLoader(),
        logFactory: logFactory(_.get(configuration, "sdm.rolar.url")),
        credentialsResolver: new GitHubCredentialsResolver(),
    };
}
