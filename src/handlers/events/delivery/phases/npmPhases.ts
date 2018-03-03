
import { Phases } from "../../../../common/phases/Phases";
import { BuildContext, ScanContext } from "./httpServicePhases";

export const npmPhases = new Phases([
    ScanContext,
    BuildContext,
]);
