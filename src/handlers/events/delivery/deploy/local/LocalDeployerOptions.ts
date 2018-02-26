
export interface LocalDeployerOptions {

    /**
     * url of the host
     */
    baseUrl: string;

    /**
     * Initial port to use
     */
    lowerPort?: number;
}

export const DefaultLocalDeployerOptions: Partial<LocalDeployerOptions> = {
    lowerPort: 8080,
};
