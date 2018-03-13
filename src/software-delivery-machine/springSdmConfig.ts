import { logger } from "@atomist/automation-client";
import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { FunctionalUnit } from "../";
import { SoftwareDeliveryMachine } from "../blueprint/SoftwareDeliveryMachine";
import { tagRepo } from "../common/listener/tagRepo";
import { ExecuteGoalOnPendingStatus } from "../handlers/events/delivery/build/ExecuteGoalOnPendingStatus";
import { deployOnLocal } from "../handlers/events/delivery/deploy/DeployFromLocalOnPendingLocalDeployStatus";
import { LocalDeploymentGoal, LocalEndpointGoal } from "../handlers/events/delivery/goals/httpServiceGoals";
import { mavenFingerprinter } from "../handlers/events/delivery/scan/fingerprint/maven/mavenFingerprinter";
import { checkstyleReviewer } from "../handlers/events/delivery/scan/review/checkstyle/checkstyleReviewer";
import { OnDryRunBuildComplete } from "../handlers/events/dry-run/OnDryRunBuildComplete";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { disposeProjectHandler } from "./blueprint/deploy/dispose";
import { MavenDeployer } from "./blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { PostToDeploymentsChannel } from "./blueprint/deploy/postToDeploymentsChannel";
import { presentPromotionInformation } from "./blueprint/deploy/presentPromotionInformation";
import { requestDescription } from "./blueprint/issue/requestDescription";
import { thankYouYouRock } from "./blueprint/issue/thankYouYouRock";
import { PublishNewRepo } from "./blueprint/repo/publishNewRepo";
import { logReview } from "./blueprint/review/logReview";
import { tryToUpgradeSpringBootVersion } from "./commands/editors/spring/tryToUpgradeSpringBootVersion";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";

/**
 * Configuration common to Spring SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} softwareDeliveryMachine
 * @param {{useCheckstyle: boolean}} opts
 */
export function configureSpringSdm(softwareDeliveryMachine: SoftwareDeliveryMachine, opts: { useCheckstyle: boolean }) {
    softwareDeliveryMachine
        .addNewIssueListeners(requestDescription)
        .addClosedIssueListeners(thankYouYouRock)
        .addEditors(() => tryToUpgradeSpringBootVersion)
        .addGenerators(() => springBootGenerator({
            seedOwner: "spring-team",
            seedRepo: "spring-rest-seed",
        }))
        .addNewRepoWithCodeActions(
            tagRepo(springBootTagger),
            PublishNewRepo)
        .addProjectReviewers(logReview);
    if (opts.useCheckstyle) {
        const checkStylePath = process.env.CHECKSTYLE_PATH;
        if (!!checkStylePath) {
            softwareDeliveryMachine.addProjectReviewers(checkstyleReviewer(checkStylePath));
        } else {
            logger.warn("Skipping Checkstyle; to enable it, set CHECKSTYLE_PATH env variable to the location of a downloaded checkstyle jar");
        }
    }

    softwareDeliveryMachine
    // .addCodeReactions(listChangedFiles)
        .addDeploymentListeners(PostToDeploymentsChannel)
        .addVerifiedDeploymentListeners(presentPromotionInformation)
        .addSupportingCommands(
            DescribeStagingAndProd,
            () => disposeProjectHandler,
        )
        .addSupportingEvents(OnDryRunBuildComplete)
        .addFunctionalUnits(localDeployer);

    softwareDeliveryMachine.addFingerprinters(mavenFingerprinter);
    // .addFingerprintDifferenceListeners(diff1)
}

const localDeployer: FunctionalUnit = {
    eventHandlers: [
        () => new ExecuteGoalOnPendingStatus("LocalDeploy",
        LocalDeploymentGoal, deployOnLocal(LocalEndpointGoal, MavenDeployer)),
    ],
    commandHandlers: [],
};
