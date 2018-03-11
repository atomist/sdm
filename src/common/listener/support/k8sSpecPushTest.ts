import { AtomistK8sSpecFile } from "../../../software-delivery-machine/commands/editors/k8s/addK8sSpec";
import { PushTest, PushTestInvocation } from "../GoalSetter";

export const HasK8Spec: PushTest = (pi: PushTestInvocation) =>
    pi.project.findFile(AtomistK8sSpecFile)
        .then(() => true, () => false);
