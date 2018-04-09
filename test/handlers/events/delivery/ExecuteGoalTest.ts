import "mocha";
import * as assert from "power-assert";
import { executeGoal } from "../../../../src/handlers/events/delivery/verify/executeGoal";
import { Success } from "@atomist/automation-client";
import { RunWithLogContext } from "../../../../src/common/delivery/goals/support/runWithLog";
import { lastTenLinesLogInterpreter } from "../../../../src/common/delivery/goals/support/logInterpreters";
import { SdmGoal } from "../../../../src/ingesters/sdmGoalIngester";
import { Goal } from "../../../../src/common/delivery/goals/Goal";
import { IndependentOfEnvironment } from "../../../../src/common/delivery/goals/gitHubContext";
import { fakeContext } from "../../../software-delivery-machine/FakeContext";
import { SingleProjectLoader } from "../../../common/SingleProjectLoader";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { createEphemeralProgressLog } from "../../../../src/common/log/EphemeralProgressLog";


const helloWorldGoalExecutor = async (rwlc: RunWithLogContext) => {
    rwlc.progressLog.write("Hello world\n");
    return Success;
};


const fakeGoal = new Goal({
    uniqueCamelCaseName: "HelloWorld",
    environment: IndependentOfEnvironment, orderedName: "0-yo"
});

const fakeSdmGoal = {fulfillment: {name: "HelloWorld"}, environment: "0-code"} as SdmGoal;

const fakeCredentials = {token: "NOT-A-TOKEN"};

describe("executing the goal", () => {
    it("calls a pre-hook and sends output to the log", (done) => {

        const projectLoader = new SingleProjectLoader(InMemoryProject.of());


        createEphemeralProgressLog().then(progressLog => {
            const fakeRWLC = {
                context: fakeContext(),
                progressLog: progressLog,
                credentials: fakeCredentials
            } as any as RunWithLogContext;


            return executeGoal({projectLoader},
                helloWorldGoalExecutor,
                fakeRWLC,
                fakeSdmGoal,
                fakeGoal,
                lastTenLinesLogInterpreter("hi"))
                .then(result => {
                    fakeRWLC.progressLog.close();

                    //   const result = Success;
                    assert.equal(result.code, 0, result.message);
                    assert(fakeRWLC.progressLog.log.includes("Hello world"));
                })
         }).then(() => done(), done);
    });

});
