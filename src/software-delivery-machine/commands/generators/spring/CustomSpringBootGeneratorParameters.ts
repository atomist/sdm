import { Parameter } from "@atomist/automation-client";
import { SpringBootGeneratorParameters } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectParameters";
import { JavaGeneratorConfig } from "./JavaGeneratorConfig";

/**
 * Custom parameters for Spring Boot.
 * Customize spring-automations default parameters to default our group
 * and choose our seed
 */
export class CustomSpringBootGeneratorParameters extends SpringBootGeneratorParameters {

    @Parameter({
        displayName: "Maven Group ID",
        description: "Maven group identifier, often used to provide a namespace for your project," +
        " e.g., com.pany.team",
        pattern: /^.*$/,
        validInput: "a valid Maven group ID, which starts with a letter, -, or _ and contains only" +
        " alphanumeric, -, and _ characters and may having leading period separated identifiers starting" +
        " with letters or underscores and containing only alphanumeric and _ characters.",
        minLength: 1,
        maxLength: 50,
        required: false,
        order: 50,
    })
    public groupId: string = "myco";

    @Parameter({
        displayName: "Class Name",
        description: "name for the service class",
        pattern: /^.*$/,
        validInput: "a valid Java class name, which contains only alphanumeric characters, $ and _" +
        " and does not start with a number",
        minLength: 1,
        maxLength: 50,
        required: false,
    })
    public serviceClassName: string;

    @Parameter({
        displayName: "Seed repo",
        description: "Seed repo",
        pattern: /^.*$/,
        validInput: "a GitHub repo in this org",
        minLength: 1,
        maxLength: 50,
        required: false,
    })
    public seed: string = "spring-rest-seed";

    constructor(params: JavaGeneratorConfig) {
        super();
        this.source.owner = params.seedOwner;
        this.seed = params.seedRepo;
    }

    public bindAndValidate() {
        super.bindAndValidate();
        this.source.repo = this.seed;
    }

}
