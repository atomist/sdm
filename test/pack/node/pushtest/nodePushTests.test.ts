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

import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { PushListenerInvocation } from "../../../../lib/api/listener/PushListener";
import { IsAtomistAutomationClient } from "../../../../lib/pack/node/pushtest/nodePushTests";

describe("nodePushTests", () => {
    describe("IsAtomistAutomationClient", () => {
        it("should not find automation client in empty repo", async () => {
            const project = InMemoryProject.of();
            const r = await IsAtomistAutomationClient.mapping(({ project } as any) as PushListenerInvocation);
            assert(!r);
        });

        it("should find automation client when it is a dependency", async () => {
            const content = `{
  "name": "@atomist/k8-automation",
  "version": "0.9.0",
  "description": "Automations for deploying, updating, and removing resources in Kubernetes",
  "author": "Atomist",
  "license": "Apache-2.0",
  "dependencies": {
    "@atomist/automation-client": "^0.19.4",
    "@atomist/automation-client-ext-logzio": "0.1.0-20180628224529",
    "@atomist/sdm": "^0.3.2-20180801121109",
    "app-root-path": "^2.0.1",
    "json-stringify-safe": "^5.0.1",
    "kubernetes-client": "^5.3.0",
    "lodash": "^4.17.5",
    "logzio-nodejs": "^0.4.10",
    "promise-retry": "^1.1.1",
    "serialize-error": "^2.1.0",
    "winston-logzio": "^1.0.6"
  }
}
`;
            const project = InMemoryProject.of({ path: "package.json", content });
            const r = await IsAtomistAutomationClient.mapping(({ project } as any) as PushListenerInvocation);
            assert(r);
        });

        it("should find automation client when it is a dependency", async () => {
            const content = `{
  "name": "@atomist/k8s-sdm",
  "version": "0.9.0",
  "dependencies": {
    "@atomist/sdm": "^2.0.0"
  }
}
`;
            const project = InMemoryProject.of({ path: "package.json", content });
            const r = await IsAtomistAutomationClient.mapping(({ project } as any) as PushListenerInvocation);
            assert(r);
        });

        it("should not find automation client when not in dependencies", async () => {
            const content = `{
  "name": "@atomist/k8-automation",
  "version": "0.9.0",
  "description": "Automations for deploying, updating, and removing resources in Kubernetes",
  "author": "Atomist",
  "license": "Apache-2.0",
  "dependencies": {
    "@atomist/automation-client-ext-logzio": "0.1.0-20180628224529",
    "app-root-path": "^2.0.1",
    "json-stringify-safe": "^5.0.1",
    "kubernetes-client": "^5.3.0",
    "lodash": "^4.17.5",
    "logzio-nodejs": "^0.4.10",
    "promise-retry": "^1.1.1",
    "serialize-error": "^2.1.0",
    "winston-logzio": "^1.0.6"
  }
}
`;
            const project = InMemoryProject.of({ path: "package.json", content });
            const r = await IsAtomistAutomationClient.mapping(({ project } as any) as PushListenerInvocation);
            assert(!r);
        });
    });
});
