import { Goals } from "../../../../common/goals/Goal";
import {
    JustBuildGoal,
    ReviewGoal,
} from "./commonGoals";

export const LibraryGoals = new Goals(
    ReviewGoal,
    JustBuildGoal,
);
