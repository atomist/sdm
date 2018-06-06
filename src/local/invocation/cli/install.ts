import { sdm } from "../machine";

/**
 * Usage gitHookTrigger <event> <directory>
 */

/* tslint:disable */

const args = process.argv.slice(2);

sdm.installGitHooks();