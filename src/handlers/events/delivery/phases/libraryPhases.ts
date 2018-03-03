import { Phases } from "../../../../common/phases/Phases";
import { BuildContext, ScanContext } from "./httpServicePhases";

export const LibraryPhases = new Phases([
    ScanContext,
    BuildContext,
]);
