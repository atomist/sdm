import { Goals } from "../../../../common/goals/Goal";
import {
    JustBuildGoal,
    ReviewGoal,
} from "./httpServiceGoals";

export const LibraryGoals = new Goals(
    ReviewGoal,
    JustBuildGoal,
);
