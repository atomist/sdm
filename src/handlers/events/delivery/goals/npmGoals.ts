
import { Goals } from "../../../../common/goals/Goal";
import { BuildGoal, ScanGoal } from "./httpServiceGoals";

export const NpmGoals = new Goals([
    ScanGoal,
    BuildGoal,
]);
