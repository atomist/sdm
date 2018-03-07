import { Goals } from "../../../../common/goals/Goal";
import { BuildGoal, ScanGoal } from "./httpServiceGoals";

export const LibraryGoals = new Goals([
    ScanGoal,
    BuildGoal,
]);
