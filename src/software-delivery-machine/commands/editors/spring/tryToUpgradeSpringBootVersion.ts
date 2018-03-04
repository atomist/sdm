import { HandleCommand } from "@atomist/automation-client";
import { setSpringBootVersionEditor } from "@atomist/spring-automation/commands/editor/spring/setSpringBootVersionEditor";
import { UnleashPhilParameters } from "@atomist/spring-automation/commands/editor/spring/unleashPhil";
import { dryRunEditor } from "../../../../handlers/commands/editors/dry-run/dryRunEditor";

export const tryToUpgradeSpringBootVersion: HandleCommand<any> = dryRunEditor<UnleashPhilParameters>(
    params => setSpringBootVersionEditor(params.desiredBootVersion),
    UnleashPhilParameters,
    "boot-upgrade", {
        description: `Upgrade Spring Boot version`,
        intent: "try to upgrade Spring Boot",
    },
    );
