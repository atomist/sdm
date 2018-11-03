import { ParametersInvocation } from "../listener/ParametersInvocation";
import { PushImpactListenerInvocation } from "../listener/PushImpactListener";

/**
 * Code inspections or autofixes may be invoked in response to a push,
 * or just with Parameters
 */
export interface PushAwareParametersInvocation<P> extends ParametersInvocation<P> {

    /**
     * The push invocation. Will be undefined if we are not invoked from a push.
     */
    push?: PushImpactListenerInvocation;
}