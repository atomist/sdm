import { DeployableArtifact } from "../../spi/artifact/ArtifactStore";
import { ListenerInvocation, SdmListener } from "./Listener";

export interface ArtifactInvocation extends ListenerInvocation {

    deployableArtifact: DeployableArtifact;

}

export type ArtifactListener = SdmListener<ArtifactInvocation>;
