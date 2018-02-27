
import { Phases } from "../Phases";
import { BaseContext, BuildContext, IndependentOfEnvironment, ScanContext } from "./gitHubContext";

export const npmPhases = new Phases([
    ScanContext,
    BuildContext,
]);
