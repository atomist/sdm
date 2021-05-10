import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import * as assert from "power-assert";
import {
	SdmGoalFulfillmentMethod,
	SdmGoalMessage,
} from "../../../lib/api/goal/SdmGoalMessage";
import {
	GoalSigningConfiguration,
	GoalSigningScope,
} from "../../../lib/api/machine/SigningKeys";
import {
	signGoal,
	verifyGoal,
} from "../../../lib/core/signing/goalSigning";
import { SdmGoalState } from "../../../lib/typings/types";

describe("jwtGoalSigning", () => {

	const publicKey = fs.readFileSync(path.join(__dirname, "es512-public.pem")).toString();
	const privateKey = fs.readFileSync(path.join(__dirname, "es512-private.pem")).toString();

	const goalMessage: SdmGoalMessage = {
		environment: "0-code",
		uniqueName: "build#goals.ts:42",
		name: "build",
		sha: "329f8ed3746d969233ef11c5cae72a3d9231a09d",
		branch: "master",
		fulfillment: {
			method: SdmGoalFulfillmentMethod.Sdm,
			name: "npm-run-build",
			registration: "@atomist/atomist-sdm",
		},
		description: "Building",
		descriptions: {} as any,
		url: "https://app.atomist.com/workspace/T29E48P34/logs/atomist/sdm-pack-node",
		externalUrls: [],
		state: SdmGoalState.in_process,
		phase: "npm compile",
		externalKey: "sdm/atomist/0-code/build#goals.ts:42",
		goalSet: "Build with Release",
		registration: "@atomist/test",
		goalSetId: "61d31727-3006-4979-b846-9f20d4e16cdd",
		ts: 1550839105466,
		retryFeasible: true,
		preConditions: [
			{
				environment: "0-code",
				uniqueName: "autofix#goals.ts:41",
				name: "autofix",
			},
			{
				environment: "0-code",
				uniqueName: "version#goals.ts:40",
				name: "version",
			},
		],
		approvalRequired: false,
		preApprovalRequired: false,
		provenance: [
			{
				registration: "@atomist/atomist-sdm-job-61d3172-build",
				version: "1.0.3-master.20190222122821",
				name: "FulfillGoalOnRequested",
				correlationId: "b14ac8be-43ce-4e68-b843-ec9e12449676",
				ts: 1550839105466,
			},
			{
				correlationId: "b14ac8be-43ce-4e68-b843-ec9e12449676",
				registration: "@atomist/atomist-sdm",
				name: "SetGoalState",
				version: "1.0.3-master.20190222122821",
				ts: 1550839066508,
			},
			{
				correlationId: "fd6029dd-73f9-4941-8b64-c1591d58d9ec",
				registration: "@atomist/atomist-sdm-job-61d3172-build",
				name: "FulfillGoalOnRequested",
				version: "1.0.3-master.20190221080543",
				ts: 1550837963831,
			},
			{
				correlationId: "fd6029dd-73f9-4941-8b64-c1591d58d9ec",
				registration: "@atomist/atomist-sdm",
				name: "RequestDownstreamGoalsOnGoalSuccess",
				version: "1.0.3-master.20190221080543",
				ts: 1550837901174,
			},
			{
				correlationId: "fd6029dd-73f9-4941-8b64-c1591d58d9ec",
				registration: "@atomist/atomist-sdm",
				name: "SetGoalsOnPush",
				version: "1.0.3-master.20190221080543",
				ts: 1550837810077,
			},
		],
		version: 17,
		repo: {
			name: "sdm-pack-node",
			owner: "atomist",
			providerId: "zjlmxjzwhurspem",
		},
		parameters: JSON.stringify({ foo: "bar" }),
	};

	it("should correctly sign and verify goal", async () => {
		const gsc: GoalSigningConfiguration = {
			enabled: true,
			scope: GoalSigningScope.All,
			signingKey: { publicKey, privateKey, name: "atomist.com/test", algorithm: "jwt-es512" },
			verificationKeys: [{ publicKey, name: "atomist.com/test", algorithm: "jwt-es512"}],
		};
		const signedGoal = await signGoal(_.cloneDeep(goalMessage) as any, gsc);
		assert(!!signedGoal.signature);
		const result = await verifyGoal(signedGoal as any, gsc, {} as any);
		assert.deepStrictEqual(result, signedGoal);
	});

})
