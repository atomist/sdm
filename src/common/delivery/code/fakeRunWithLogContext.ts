import { RunWithLogContext } from "../deploy/runWithLog";
import { fakeContext } from "../../../../test/software-delivery-machine/FakeContext";
import { RemoteRepoRef, RepoId } from "@atomist/automation-client/operations/common/RepoId";
import { ConsoleProgressLog } from "../../log/progressLogs";
import { StatusForExecuteGoal, StatusState } from "../../../typings/types";

export function fakeRunWithLogContext(id: RemoteRepoRef): RunWithLogContext {
    return {
        credentials: {token: "foobar"},
        context: fakeContext("T1111"),
        id,
        addressChannels: async () => {
        },
        status: fakeStatus(id),
        progressLog: new ConsoleProgressLog(),
    };
}

export function fakeStatus(id: RepoId): StatusForExecuteGoal.Fragment {
    return {
        context: "fake",
        state: StatusState.pending,
        commit: {
            repo: {
                org: {
                    owner: id.owner,
                },
                name: id.repo,
            },
        },
    };
}
