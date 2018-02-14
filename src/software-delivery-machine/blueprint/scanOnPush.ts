import { HandlerContext } from "@atomist/automation-client";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { ProjectScanResult, ScanOnPendingScanStatus } from "../../handlers/events/delivery/ScanOnPendingScanStatus";

export const Scan = new ScanOnPendingScanStatus(scan);

async function scan(p: GitProject,
                    ctx: HandlerContext): Promise<ProjectScanResult> {
    // try {
    //     await p.findFile("pom.xml");
    //     return {passed: true};
    // } catch {
    //     return {passed: false, message: "This project has no pom. Cannot deploy"};
    // }

    return { passed: true };
}
