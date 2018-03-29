
import { SmokeTestConfig } from "./framework/config";

export const TestConfig: SmokeTestConfig = {

    atomistTeamId: "T5964N9B7",
    baseEndpoint: "http://localhost:2866",

    user: "admin",
    password: process.env.LOCAL_ATOMIST_ADMIN_PASSWORD,

    githubOrg: "spring-team",
};
