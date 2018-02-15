import {HandleCommand, HandlerContext, MappedParameter, MappedParameters, Parameter, Secret, Secrets, Success} from "@atomist/automation-client";
import {CommandHandler} from "@atomist/automation-client/decorators";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {addressSlackUsers} from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import * as stringify from "json-stringify-safe";
import {listStatuses, Status} from "../../handlers/commands/editors/toclient/ghub";
import {EnvironmentCloudFoundryTarget} from "../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import {deploy} from "../../handlers/events/delivery/DeployFromLocalOnArtifactStatus";
import {ArtifactContext} from "../../handlers/events/delivery/phases/httpServicePhases";
import {ProductionDeployPhases} from "../../handlers/events/delivery/phases/productionDeployPhases";
import {artifactStore} from "./artifactStore";
import {Deployer} from "./cloudFoundryDeployOnArtifactStatus";

@CommandHandler("Promote to production", "promote to production")
export class DeployToProd implements HandleCommand {

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    private githubToken: string;

    @MappedParameter(MappedParameters.SlackUserName)
    private slackUserName: string;

    @Parameter()
    private owner: string;

    @Parameter()
    private repo: string;

    @Parameter()
    private sha: string;

    // update this message
    @Parameter({required: false})
    private messageId: string;

    // in these channels
    @Parameter({required: false})
    private destinationsJson: string;

    public async handle(ctx: HandlerContext, params: this): Promise<any> {

        const address = (message: slack.SlackMessage | string) => {
            const destination = params.destinationsJson ? JSON.parse(params.destinationsJson) :
                addressSlackUsers(ctx.teamId, params.slackUserName);
            const messageOptions = {id: params.messageId}; // undefined is ok
            return ctx.messageClient.send(message, destination, messageOptions);
        };

        await address(workingMessage(params));

        const id = new GitHubRepoRef(params.owner, params.repo, params.sha);
        const creds = {token: params.githubToken};
        await ProductionDeployPhases.setAllToPending(id, creds);
        const artifactStatus = await findArtifactStatus(id, params.githubToken);
        if (!artifactStatus) {
            await address("Did not find artifact for " + stringify(id));
            return Success;
        }

        const result = await deploy(ProductionDeployPhases.phases[0],
            ProductionDeployPhases.phases[1],
            id, params.githubToken, artifactStatus.target_url,
            artifactStore, Deployer,
            ProductionCloudFoundryTargeter);

        if (result.code === 0) {
            await address(successMessage(params));
        } else {
            await address(tryAgainMessage(params, result.message));
        }

        return result;
    }
}

function successMessage(params: DeployToProd) {
    return "did it";
}

function workingMessage(params: DeployToProd) {
    return "working on it";
}

function tryAgainMessage(params: DeployToProd, message: string) {
    return "failed";
}

const ProductionCloudFoundryTargeter = () => ({
    ...new EnvironmentCloudFoundryTarget(),
    space: "ri-production",
});

/**
 * Rewrite the artifact status so that we get a new event
 * @param {GitHubRepoRef} id
 * @param {string} token
 * @return {Promise<any>}
 */
function findArtifactStatus(id: GitHubRepoRef, token: string): Promise<Status> {
    return listStatuses(token, id)
        .then(statuses => {
            return statuses.find(s => s.context === ArtifactContext);
        });
}
