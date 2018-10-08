import { Goal } from "../Goal";
import { IndependentOfEnvironment } from "../support/environment";

export const Locking = new Goal({
    uniqueName: "lock",
    displayName: "lock",
    completedDescription: "Lock goals",
    environment: IndependentOfEnvironment,
});