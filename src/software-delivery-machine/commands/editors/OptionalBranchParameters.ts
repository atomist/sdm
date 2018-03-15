
import { Parameter, Parameters } from "@atomist/automation-client";

@Parameters()
export class OptionalBranchParameters {

    @Parameter({ required: false})
    public branch;

}
