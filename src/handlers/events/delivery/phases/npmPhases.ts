
import { BaseContext, BuildContext, IndependentOfEnvironment, ScanContext } from "../../../../common/phases/gitHubContext";
import { Phases } from "../../../../common/phases/Phases";

export const npmPhases = new Phases([
    ScanContext,
    BuildContext,
]);
