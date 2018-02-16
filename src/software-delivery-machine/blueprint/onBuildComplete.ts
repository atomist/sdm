
import { BuiltContext } from "../../handlers/events/delivery/phases/httpServicePhases";
import { SetStatusOnBuildComplete } from "../../handlers/events/delivery/SetStatusOnBuildComplete";

export const OnBuildComplete = () => new SetStatusOnBuildComplete(BuiltContext);
