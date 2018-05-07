import { PushTest } from "./PushTest";

/**
 * Superclass for registering actions or listeners associated with a push
 */
export interface PushRegistration<A> {

    name: string;

    pushTest?: PushTest;

    action: A;

}
