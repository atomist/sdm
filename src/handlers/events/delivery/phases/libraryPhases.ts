import { Phases } from "../Phases";
import { BuildContext, ScanContext } from "./gitHubContext";

export const LibraryPhases = new Phases([
    ScanContext,
    BuildContext,
]);
