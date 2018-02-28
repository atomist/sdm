
import { ProjectListenerInvocation, SdmListener } from "./Listener";

export interface CodeReactionInvocation extends ProjectListenerInvocation {

    filesChanged: string[];

}

export type CodeReactionListener = SdmListener<CodeReactionInvocation>;
