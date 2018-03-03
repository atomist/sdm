import { Phases } from "../../../../common/phases/Phases";
import { BuildPhase, ScanPhase } from "./httpServicePhases";

export const LibraryPhases = new Phases([
    ScanPhase,
    BuildPhase,
]);
