import {HandleCommand, MappedParameter, MappedParameters, Parameter, Secret, Secrets} from "@atomist/automation-client";
import {Parameters} from "@atomist/automation-client/decorators";

export interface EventWithCommand {
    correspondingCommand?: () => HandleCommand;
}

@Parameters()
export class RetryDeployParameters {

    @Parameter()
    public repo: string;

    @Parameter()
    public owner: string;

    @Parameter()
    public sha: string;

    @Parameter()
    public targetUrl: string;

    @Secret(Secrets.UserToken)
    public githubToken: string;

    @MappedParameter(MappedParameters.SlackChannelName)
    public channelName: string;

}
