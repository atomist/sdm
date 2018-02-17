
import { SetStatusOnBuildComplete } from "../../../handlers/events/delivery/build/SetStatusOnBuildComplete";
import { BuiltContext } from "../../../handlers/events/delivery/phases/httpServicePhases";

export const OnBuildComplete = () => new SetStatusOnBuildComplete(BuiltContext);
