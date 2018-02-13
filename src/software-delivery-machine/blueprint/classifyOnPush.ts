import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { JvmService, Unknown } from "../../handlers/events/classification";
import { Classification, SetupPhasesOnPush } from "../../handlers/events/delivery/SetupPhasesOnPush";

export const BootClassifyOnPush = new SetupPhasesOnPush(scan);

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
