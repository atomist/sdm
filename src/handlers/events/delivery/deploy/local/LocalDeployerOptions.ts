
export interface StartupInfo {

    port: number;

    atomistTeam: string;

    contextRoot: string;
}

export interface LocalDeployerOptions {

    /**
     * url of the host
     */
    baseUrl: string;

    /**
     * Initial port to use
     */
    lowerPort?: number;

    /**
     * Command line arguments for the startup process to
     * expose our port and Atomist team if possible
     * Should be an array as valid input into node spawn
     * @param {StartupInfo} s
     * @return {string[]}
     */
    commandLineArgumentsFor: (s: StartupInfo) => string[];
}

export const DefaultLocalDeployerOptions: Partial<LocalDeployerOptions> = {
    lowerPort: 8080,
};
