import { HandlerContext } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

/**
 * Provide credentials for handler invocation.
 */
export interface CredentialsFactory {

    eventHandlerCredentials(context: HandlerContext): ProjectOperationCredentials;
}
