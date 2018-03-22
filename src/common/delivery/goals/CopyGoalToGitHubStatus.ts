import { EventHandler, HandleEvent, HandlerContext, HandlerResult, Secret, Secrets, Success } from "@atomist/automation-client";


@EventHandler("yes",
    `subscription OnAnyGoal {
    SdmGoal {
        goalSet
        environment
        name
        sha
        branch
        state
        description
        externalKey
        context
    }
}`)
export class CopyGoalToGitHubStatus implements HandleEvent<any> {
    @Secret(Secrets.OrgToken)
    private githubToken: string;

    public async handle(event: any, context: HandlerContext, params: this): Promise<HandlerResult> {
      //  return createStatus(params.githubToken, )
        return Success;
    }

}