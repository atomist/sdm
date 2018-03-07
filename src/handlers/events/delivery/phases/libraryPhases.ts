import { Goals } from "../../../../common/goals/Goal";
import { BuildGoal, ScanGoal } from "./httpServicePhases";

export const LibraryPhases = new Goals([
    ScanGoal,
    BuildGoal,
]);
