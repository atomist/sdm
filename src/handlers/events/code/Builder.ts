import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { ChildProcess, spawn } from "child_process";
import EventEmitter = NodeJS.EventEmitter;

export interface Builder {

    // TODO take the id, so we can send it to another machine?
    build<P extends LocalProject>(p: P): EventEmitter;
}
