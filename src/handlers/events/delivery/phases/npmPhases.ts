
import { Phases } from "../../../../common/phases/Phases";
import { BuildPhase, ScanPhase } from "./httpServicePhases";

export const npmPhases = new Phases([
    ScanPhase,
    BuildPhase,
]);
