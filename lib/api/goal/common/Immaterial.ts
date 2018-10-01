import {
    logger,
    Success,
} from "@atomist/automation-client";
import { goals } from "../Goals";
import { GoalWithFulfillment } from "../GoalWithFulfillment";

/**
 * Goal that should be scheduled for immaterial changes.
 * Uses a no-op goalExecutor.
 */
export const Immaterial = new GoalWithFulfillment({
    uniqueName: "nevermind",
    displayName: "immaterial",
    completedDescription: "No material changes",
}).with({
    name: "immaterial",
    goalExecutor: async () => {
        logger.debug("Immaterial: Nothing to execute");
        return Success;
    },
});

/**
 * Goals instance for Immaterial changes
 */
export const ImmaterialGoals = goals("Immaterial change").plan(Immaterial);

