import { AtomistK8sSpecFile } from "../../../software-delivery-machine/commands/editors/k8s/addK8sSpec";
import { GoalSetterInvocation, PushTest } from "../GoalSetter";

export const HasK8Spec: PushTest = (pi: GoalSetterInvocation) =>
    pi.project.findFile(AtomistK8sSpecFile)
        .then(() => true, () => false);
