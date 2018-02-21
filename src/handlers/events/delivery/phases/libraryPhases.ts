import { Phases } from "../Phases";
import { BuiltContext, ScanContext } from "./gitHubContext";

export const LibraryPhases = new Phases([
    ScanContext,
    BuiltContext,
]);
