import { AxiosRequestConfig } from "axios";
import axios from "axios";

export interface SmokeTestConfig {
    atomistTeamId: string;
    jwt: string;
    baseEndpoint: string;

    user: string;

    password: string;
}

export const DefaultSmokeTestConfig = {

    atomistTeamId: "T5964N9B7",
    jwt: "33cbc21d-fed4-4695-b0de-d383bf82c1fc",
    baseEndpoint: "http://localhost:2866",

    user: "admin",
    password: "d11da242-2a4d-4a09-a154-132b961c0162",

};

export function automationServerAuthHeaders(config: SmokeTestConfig): AxiosRequestConfig {
    return {
        headers: {
            "content-type": "application/json",
            // Authorization: `Bearer ${config.jwt}`,
        },
        auth: {
            username: config.user,
            password: config.password,
        },
    };
}

/*
export async function getBearerToken(config: SmokeTestConfig): Promise<string> {
    // curl -u admin:100dd8e5-a154-4598-b124-879abb89df62 -v localhost:2866/info
    const url = config.baseEndpoint + "/info";
    const res = await axios.get(url, {

    })

}
*/