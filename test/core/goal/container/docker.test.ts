/*
 * Copyright © 2020 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { NodeFsLocalProject } from "@atomist/automation-client/lib/project/local/NodeFsLocalProject";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as assert from "power-assert";
import { execPromise } from "../../../../lib/api-helper/misc/child_process";
import { fakePush } from "../../../../lib/api-helper/testsupport/fakePush";
import { ExecuteGoalResult } from "../../../../lib/api/goal/ExecuteGoalResult";
import { GoalInvocation } from "../../../../lib/api/goal/GoalInvocation";
import {
    Container,
    GoalContainer,
} from "../../../../lib/core/goal/container/container";
import {
    containerDockerOptions,
    dockerTmpDir,
    executeDockerJob,
} from "../../../../lib/core/goal/container/docker";
import { runningInK8s } from "../../../../lib/core/goal/container/util";
import { containerTestImage } from "./util";

/* tslint:disable:max-file-line-count */

describe("goal/container/docker", () => {

    describe("containerDockerOptions", () => {

        it("should return an empty array", () => {
            const c = {
                image: "townes/tecumseh-valley:4.55",
                name: "townes",
            };
            const r = {
                containers: [c],
            };
            const o = containerDockerOptions(c, r);
            const e = [];
            assert.deepStrictEqual(o, e);
        });

        it("should handle command as entrypoint", () => {
            const c = {
                image: "townes/tecumseh-valley:4.55",
                name: "townes",
                command: ["daughter"],
            };
            const r = {
                containers: [c],
            };
            const o = containerDockerOptions(c, r);
            const e = ["--entrypoint=daughter"];
            assert.deepStrictEqual(o, e);
        });

        it("should move extra command elements to args", () => {
            const c: GoalContainer = {
                image: "townes/tecumseh-valley:4.55",
                name: "townes",
                command: ["daughter", "of", "a", "miner"],
            };
            const r = {
                containers: [c],
            };
            const o = containerDockerOptions(c, r);
            const e = ["--entrypoint=daughter"];
            assert.deepStrictEqual(o, e);
            assert.deepStrictEqual(c.args, ["of", "a", "miner"]);
        });

        it("should prepend extra command elements to args", () => {
            const c = {
                args: ["her", "ways", "were", "free"],
                image: "townes/tecumseh-valley:4.55",
                name: "townes",
                command: ["daughter", "of", "a", "miner"],
            };
            const r = {
                containers: [c],
            };
            const o = containerDockerOptions(c, r);
            const e = ["--entrypoint=daughter"];
            assert.deepStrictEqual(o, e);
            assert.deepStrictEqual(c.args, ["of", "a", "miner", "her", "ways", "were", "free"]);
        });

        it("should handle env", () => {
            const c = {
                image: "townes/tecumseh-valley:4.55",
                name: "townes",
                env: [
                    {
                        name: "DAUGHTER",
                        value: "miner",
                    },
                    {
                        name: "DAYS",
                        value: "free",
                    },
                    {
                        name: "SUNSHINE",
                        value: "walked beside her",
                    },
                ],
            };
            const r = {
                containers: [c],
            };
            const o = containerDockerOptions(c, r);
            const e = ["--env=DAUGHTER=miner", "--env=DAYS=free", "--env=SUNSHINE=walked beside her"];
            assert.deepStrictEqual(o, e);
        });

        it("should handle ports", () => {
            const c = {
                image: "townes/tecumseh-valley:4.55",
                name: "townes",
                ports: [
                    {
                        containerPort: 1238,
                    },
                    {
                        containerPort: 2247,
                    },
                    {
                        containerPort: 4304,
                    },
                ],
            };
            const r = {
                containers: [c],
            };
            const o = containerDockerOptions(c, r);
            const e = ["-p=1238", "-p=2247", "-p=4304"];
            assert.deepStrictEqual(o, e);
        });

        it("should handle volumes", () => {
            const c = {
                image: "townes/tecumseh-valley:4.55",
                name: "townes",
                volumeMounts: [
                    {
                        mountPath: "/like/a/summer/thursday",
                        name: "Thursday",
                    },
                    {
                        mountPath: "/our/mother/the/mountain",
                        name: "mountain",
                    },
                ],
            };
            const r = {
                containers: [c],
                volumes: [
                    {
                        hostPath: {
                            path: "/home/mountain",
                        },
                        name: "mountain",
                    },
                    {
                        hostPath: {
                            path: "/mnt/thursday",
                        },
                        name: "Thursday",
                    },
                ],
            };
            const o = containerDockerOptions(c, r);
            const e = ["--volume=/mnt/thursday:/like/a/summer/thursday", "--volume=/home/mountain:/our/mother/the/mountain"];
            assert.deepStrictEqual(o, e);
        });

    });

    describe("executeDockerJob", () => {

        const fakeId = fakePush().id;
        const goal = new Container();
        const projectDir = path.join(dockerTmpDir(), "atomist-sdm-docker-test-" + guid());
        let project: NodeFsLocalProject;
        const tmpDirs: string[] = [];
        let logData = "";
        const logWrite = (d: string): void => { logData += d; };
        const goalInvocation: GoalInvocation = {
            context: {
                graphClient: {
                    query: () => ({ SdmVersion: [{ version: "3.1.3-20200220200220" }] }),
                },
            },
            configuration: {
                sdm: {
                    projectLoader: {
                        doWithProject: async (o, a) => {
                            let p: NodeFsLocalProject;
                            if (o && o.cloneDir) {
                                await fs.ensureDir(o.cloneDir);
                                tmpDirs.push(o.cloneDir);
                                p = await NodeFsLocalProject.copy(project, o.cloneDir) as NodeFsLocalProject;
                            } else {
                                p = project;
                            }
                            return a(p);
                        },
                    },
                },
            },
            credentials: {},
            goalEvent: {
                branch: fakeId.branch,
                goalSetId: "27c20de4-2c88-480a-b4e7-f6c6d5a1d623",
                push: {
                    commits: [],
                },
                repo: {
                    name: fakeId.repo,
                    owner: fakeId.owner,
                    providerId: "album",
                },
                sha: fakeId.sha,
                uniqueName: goal.definition.uniqueName,
            },
            id: fakeId,
            progressLog: {
                write: logWrite,
            },
        } as any;

        before(async function dockerCheckProjectSetup(this: Mocha.Context): Promise<void> {
            this.timeout(20000);
            if (runningInK8s() || (!process.env.DOCKER_HOST && !fs.existsSync("/var/run/docker.sock"))) {
                this.skip();
            }
            try {
                await execPromise("docker", ["pull", containerTestImage], { timeout: 18000 });
            } catch (e) {
                this.skip();
            }
            await fs.ensureDir(projectDir);
            tmpDirs.push(projectDir);
            project = await NodeFsLocalProject.fromExistingDirectory(fakeId, projectDir) as any;
        });

        beforeEach(() => { logData = ""; });

        after(async function directoryCleanup(): Promise<void> {
            await Promise.all(tmpDirs.map(d => fs.remove(d)));
        });

        it("should run a docker container", async () => {
            const r = {
                containers: [
                    {
                        args: ["true"],
                        image: containerTestImage,
                        name: "alpine",
                    },
                ],
            };
            const e = executeDockerJob(goal, r);
            const egr = await e(goalInvocation);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 0, logData);
            assert(x.message === "Successfully completed container job");
        }).timeout(10000);

        it("should throw an error if there are no containers", async () => {
            const r = {
                containers: [],
            };
            const e = executeDockerJob(goal, r);
            try {
                await e(goalInvocation);
                assert.fail("execution of goal without containers should have thrown an error");
            } catch (e) {
                assert(/No containers defined in GoalContainerSpec/.test(e.message));
            }
        });

        it("should report when the container fails", async () => {
            const r = {
                containers: [
                    {
                        args: ["false"],
                        image: containerTestImage,
                        name: "alpine",
                    },
                ],
            };
            const e = executeDockerJob(goal, r);
            const egr = await e(goalInvocation);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 1);
            assert(x.message.startsWith("Docker container 'sdm-alpine-27c20de-container' failed"));
        }).timeout(10000);

        it("should run multiple containers", async () => {
            const r = {
                containers: [
                    {
                        args: ["true"],
                        image: containerTestImage,
                        name: "alpine0",
                    },
                    {
                        args: ["true"],
                        image: containerTestImage,
                        name: "alpine1",
                    },
                    {
                        args: ["true"],
                        image: containerTestImage,
                        name: "alpine2",
                    },
                ],
            };
            const e = executeDockerJob(goal, r);
            const egr = await e(goalInvocation);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 0, logData);
            assert(x.message === "Successfully completed container job");
        }).timeout(15000);

        it("should report when main container fails", async () => {
            const r = {
                containers: [
                    {
                        args: ["false"],
                        image: containerTestImage,
                        name: "alpine0",
                    },
                    {
                        args: ["true"],
                        image: containerTestImage,
                        name: "alpine1",
                    },
                ],
            };
            const e = executeDockerJob(goal, r);
            const egr = await e(goalInvocation);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 1, logData);
            assert(x.message.startsWith("Docker container 'sdm-alpine0-27c20de-container' failed"));
        }).timeout(10000);

        it("should ignore when sidecar container fails", async () => {
            const r = {
                containers: [
                    {
                        args: ["true"],
                        image: containerTestImage,
                        name: "alpine0",
                    },
                    {
                        args: ["false"],
                        image: containerTestImage,
                        name: "alpine1",
                    },
                ],
            };
            const e = executeDockerJob(goal, r);
            const egr = await e(goalInvocation);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 0, logData);
            assert(x.message === "Successfully completed container job");
        }).timeout(10000);

        it("should only wait on main container", async () => {
            const r = {
                containers: [
                    {
                        args: ["true"],
                        image: containerTestImage,
                        name: "alpine0",
                    },
                    {
                        args: ["sleep", "20"],
                        image: containerTestImage,
                        name: "alpine1",
                    },
                ],
            };
            const e = executeDockerJob(goal, r);
            const egr = await e(goalInvocation);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 0, logData);
            assert(x.message === "Successfully completed container job");
        }).timeout(10000);

        it("should allow containers to communicate", async () => {
            const r = {
                containers: [
                    {
                        args: ["sleep 1; ping -w 1 alpine1"],
                        command: ["sh", "-c"],
                        image: containerTestImage,
                        name: "alpine0",
                    },
                    {
                        args: ["sleep", "20"],
                        image: containerTestImage,
                        name: "alpine1",
                    },
                ],
            };
            const e = executeDockerJob(goal, r);
            const egr = await e(goalInvocation);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 0, logData);
            assert(x.message === "Successfully completed container job");
        }).timeout(15000);

        it("should use the registration callback", async () => {
            const r = {
                callback: async () => {
                    return {
                        containers: [
                            {
                                args: ["true"],
                                image: containerTestImage,
                                name: "alpine",
                            },
                        ],
                    };
                },
                containers: [
                    {
                        args: ["false"],
                        image: containerTestImage,
                        name: "alpine",
                    },
                ],
            };
            const e = executeDockerJob(goal, r);
            const egr = await e(goalInvocation);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 0, logData);
            assert(x.message === "Successfully completed container job");
        }).timeout(10000);

        it("should persist changes to project", async () => {
            const tmpDir = path.join(os.tmpdir(), "atomist-sdm-docker-test-" + guid());
            await fs.ensureDir(tmpDir);
            tmpDirs.push(tmpDir);
            const existingFile = `README.${guid()}`;
            let existingFilePath = path.join(tmpDir, existingFile);
            await fs.writeFile(existingFilePath, "# After Hours\n");
            const changeFile = `pigeonCamera.${guid()}`;
            let changeFilePath = path.join(tmpDir, changeFile);
            await fs.writeFile(changeFilePath, "Where's my pigeon camera?\n");
            const deleteFile = `ifyouclosethedoor_${guid()}`;
            let deleteFilePath = path.join(tmpDir, deleteFile);
            await fs.writeFile(deleteFilePath, "you won't see me\nyou won't see me\n");
            const newFile = `project-test-0-${guid()}`;
            let newFilePath = path.join(tmpDir, newFile);
            const lid = fakePush().id;
            let lp = await NodeFsLocalProject.fromExistingDirectory(lid, tmpDir) as NodeFsLocalProject;
            const lgi: GoalInvocation = {
                context: {
                    graphClient: {
                        query: () => ({ SdmVersion: [{ version: "3.1.3-20200220200220" }] }),
                    },
                },
                configuration: {
                    sdm: {
                        projectLoader: {
                            doWithProject: async (o, a) => {
                                if (o && o.cloneDir) {
                                    await fs.ensureDir(o.cloneDir);
                                    tmpDirs.push(o.cloneDir);
                                    lp = await NodeFsLocalProject.copy(lp, o.cloneDir) as NodeFsLocalProject;
                                    existingFilePath = existingFilePath.replace(tmpDir, o.cloneDir);
                                    changeFilePath = changeFilePath.replace(tmpDir, o.cloneDir);
                                    deleteFilePath = deleteFilePath.replace(tmpDir, o.cloneDir);
                                    newFilePath = newFilePath.replace(tmpDir, o.cloneDir);
                                }
                                return a(lp);
                            },
                        },
                    },
                },
                credentials: {},
                goalEvent: {
                    branch: lid.branch,
                    goalSetId: "27c20de4-2c88-480a-b4e7-f6c6d5a1d623",
                    push: {
                        commits: [],
                    },
                    repo: {
                        name: lid.repo,
                        owner: lid.owner,
                        providerId: "album",
                    },
                    sha: lid.sha,
                    uniqueName: goal.definition.uniqueName,
                },
                id: lid,
                progressLog: {
                    write: logWrite,
                },
            } as any;
            const r = {
                containers: [
                    {
                        args: [
                            `echo 'This is only a local test' > ${newFile}` +
                            `; echo 'By now it could be anywhere.' >> ${changeFile}` +
                            `; rm ${deleteFile}`,
                        ],
                        command: ["sh", "-c"],
                        image: containerTestImage,
                        name: "alpine0",
                    },
                ],
            };
            const edj = executeDockerJob(goal, r);
            const egr = await edj(lgi);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 0, logData);
            assert(x.message === "Successfully completed container job");
            const t = await lp.getFile(newFile);
            assert(t, "file created in container does not exist");
            const tc = await t.getContent();
            assert(tc === "This is only a local test\n");
            const tcf = await fs.readFile(newFilePath, "utf8");
            assert(tcf === "This is only a local test\n");
            const e = await lp.getFile(existingFile);
            assert(e, "file existing in project disappeared");
            const ec = await e.getContent();
            assert(ec === "# After Hours\n");
            const ecf = await fs.readFile(existingFilePath, "utf8");
            assert(ecf === "# After Hours\n");
            const c = await lp.getFile(changeFile);
            assert(c, "file changed in project disappeared");
            const cc = await c.getContent();
            assert(cc === "Where's my pigeon camera?\nBy now it could be anywhere.\n");
            const ccf = await fs.readFile(changeFilePath, "utf8");
            assert(ccf === "Where's my pigeon camera?\nBy now it could be anywhere.\n");
            assert(!await lp.getFile(deleteFile), "deleted file still exists in project");
            assert(!fs.existsSync(deleteFilePath), "deleted file still exists on file system");
        }).timeout(10000);

        it("should use volumes", async () => {
            const tmpDir = path.join(os.homedir(), ".atomist", "tmp", guid());
            await fs.ensureDir(tmpDir);
            tmpDirs.push(tmpDir);
            const tmpFile = `volume-test-0-${guid()}`;
            const r = {
                containers: [
                    {
                        args: [`echo 'This is only a test' > /test/vol0/${tmpFile}`],
                        command: ["sh", "-c"],
                        image: containerTestImage,
                        name: "alpine0",
                        volumeMounts: [
                            {
                                mountPath: "/test/vol0",
                                name: "test-volume",
                            },
                        ],
                    },
                ],
                volumes: [
                    {
                        hostPath: {
                            path: tmpDir,
                        },
                        name: "test-volume",
                    },
                ],
            };
            const e = executeDockerJob(goal, r);
            const egr = await e(goalInvocation);
            assert(egr, "ExecuteGoal did not return a value");
            const x = egr as ExecuteGoalResult;
            assert(x.code === 0, logData);
            assert(x.message === "Successfully completed container job");
            const tmpFilePath = path.join(tmpDir, tmpFile);
            const tmpContent = await fs.readFile(tmpFilePath, "utf8");
            assert(tmpContent === "This is only a test\n");
        }).timeout(10000);

    });

});
