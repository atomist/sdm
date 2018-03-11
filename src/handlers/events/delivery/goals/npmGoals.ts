
import { Goals } from "../../../../common/goals/Goal";
import { BuildGoal, ReviewGoal } from "./httpServiceGoals";

export const NpmGoals = new Goals([
    ReviewGoal,
    BuildGoal,
]);
