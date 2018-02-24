import { HandleCommand } from "@atomist/automation-client";
import { dryRunEditor } from "../../../handlers/commands/editors/dry-run/dryRunEditor";
import { UnleashPhilParameters } from "@atomist/spring-automation/commands/editor/spring/unleashPhil";
import { setSpringBootVersionEditor } from "@atomist/spring-automation/commands/editor/spring/setSpringBootVersionEditor";

export const tryToUpgradeSpringBootVersion: HandleCommand<any> = dryRunEditor<UnleashPhilParameters>(
    params => setSpringBootVersionEditor(params.desiredBootVersion),
    "boot-upgrade", {
        description: `Upgrade Spring Boot version`,
    },
    );
