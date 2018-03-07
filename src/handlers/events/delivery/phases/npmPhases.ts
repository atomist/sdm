
import { Goals } from "../../../../common/goals/Goal";
import { BuildGoal, ScanGoal } from "./httpServicePhases";

export const NpmPhases = new Goals([
    ScanGoal,
    BuildGoal,
]);
