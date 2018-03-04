
import { Phases } from "../../../../common/phases/Phases";
import { BuildPhase, ScanPhase } from "./httpServicePhases";

export const NpmPhases = new Phases([
    ScanPhase,
    BuildPhase,
]);
