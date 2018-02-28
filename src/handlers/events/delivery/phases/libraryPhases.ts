import { BuildContext, ScanContext } from "../../../../common/phases/gitHubContext";
import { Phases } from "../../../../common/phases/Phases";

export const LibraryPhases = new Phases([
    ScanContext,
    BuildContext,
]);
