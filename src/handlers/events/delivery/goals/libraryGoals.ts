import { Goals } from "../../../../common/goals/Goal";
import { BuildGoal, ReviewGoal } from "./httpServiceGoals";

export const LibraryGoals = new Goals(
    ReviewGoal,
    BuildGoal,
);
