import { Goals } from "../../../../common/goals/Goal";
import {
    BuildGoal,
    ReviewGoal,
} from "./commonGoals";

export const NpmGoals = new Goals(
    ReviewGoal,
    BuildGoal,
);
