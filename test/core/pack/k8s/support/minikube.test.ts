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

import * as assert from "power-assert";
import { processMinikubeDockeEnv } from "../../../../../lib/core/pack/k8s/support/minikube";

describe("pack/k8s/support/minikube", () => {

    describe("parseMinikubeDockerEnv", () => {

        it("should parse nothing", () => {
            const v = processMinikubeDockeEnv("");
            assert.deepStrictEqual(v, {});
        });

        it("should parse docker-env output", () => {
            const o = `export DOCKER_TLS_VERIFY="1"
export DOCKER_HOST="tcp://192.168.99.100:2376"
export DOCKER_CERT_PATH="/home/es/.minikube/certs"
export DOCKER_API_VERSION="1.35"
# Run this command to configure your shell:
# eval $(minikube docker-env)
`;
            const v = processMinikubeDockeEnv(o);
            const e = {
                DOCKER_TLS_VERIFY: "1",
                DOCKER_HOST: "tcp://192.168.99.100:2376",
                DOCKER_CERT_PATH: "/home/es/.minikube/certs",
                DOCKER_API_VERSION: "1.35",
            };
            assert.deepStrictEqual(v, e);
        });

        it("should handle undefined", () => {
            const v = processMinikubeDockeEnv(undefined);
            assert.deepStrictEqual(v, {});
        });

    });

    describe.skip("minikubeStartupListener", () => {

        const dockerEnv: NodeJS.ProcessEnv = {};
        function cleanEnv(save: boolean = false): void {
            Object.keys(process.env).forEach(e => {
                if (/^DOCKER_/.test(e)) {
                    if (save) {
                        dockerEnv[e] = process.env[e];
                    }
                    delete process.env[e];
                }
            });
        }
        before(() => {
            cleanEnv(true);
        });
        after(() => {
            Object.keys(dockerEnv).forEach(e => {
                process.env[e] = dockerEnv[e];
            });
        });

    });

});
