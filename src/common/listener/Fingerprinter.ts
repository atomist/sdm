
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";

export type Fingerprinter = (p: GitProject) => Promise<Fingerprint> | Promise<Fingerprint[]>;
