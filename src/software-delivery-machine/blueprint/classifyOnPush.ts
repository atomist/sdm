import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Classification, SetupStepsOnPush } from "../../handlers/events/delivery/SetupStepsOnPush";
import { JvmService, Unknown } from "../../handlers/events/classification";

export const BootClassifyOnPush = new SetupStepsOnPush(scan);

async function scan(p: GitProject): Promise<Classification> {
    try {
        const f = await p.findFile("pom.xml");
        const contents = await f.getContent();
        if (contents.includes("spring-boot")) {
            return JvmService;
        } else {
            return Unknown;
        }
    } catch {
        return Unknown;
    }
}
