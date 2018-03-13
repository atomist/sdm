

export interface Manifest {
    applications: ManifestApplication[];
}

export interface ManifestApplication {
    name: string;
    memory?: string;
    instances?: number;
    buildpack?: string;
    command?: string;
    disk_quota?: string;
    "health-check-type"?: string;
    "health-check-http-endpoint"?: string;
    "no-route"?: boolean;
    "random-route"?: boolean;
    path: string;
    stack: string;
    timeout: number;
    env: object;
    services: string[];
    routes: string[];
}