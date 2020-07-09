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

import { Project } from "@atomist/automation-client/lib/project/Project";
import * as appRoot from "app-root-path";
import * as assert from "power-assert";
import { addThirdPartyLicenseTransform } from "../../../../lib/pack/node/autofix/thirdPartyLicense";

describe("thirdPartyLicense", () => {
    it("should create license file", async () => {
        let fc: string;
        await addThirdPartyLicenseTransform()(
            ({
                baseDir: appRoot.path,
                addFile: (name: string, content: string) => {
                    fc = content;
                },
                getFile: (name: string) => {
                    if (name === ".gitattributes") {
                        return false;
                    }
                    return true;
                },
                deleteDirectory: () => "",
                hasDirectory: async () => true,
            } as any) as Project,
            undefined,
        );
        // tslint:disable:max-line-length
        assert(
            fc.startsWith(`# \`@atomist/sdm\`

\`@atomist/sdm\` is licensed under Apache License 2.0 - [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0).

This page details all runtime OSS dependencies of \`@atomist/sdm\`.

## Licenses

### Summary

| License | Count |
|---------|-------|
`),
        );
        assert(
            fc.endsWith(`
## Contact

Please send any questions or inquires to [oss@atomist.com](mailto:oss@atomist.com).

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack team][slack].

[atomist]: https://atomist.com/ (Atomist - Development Automation)
[slack]: https://join.atomist.com/ (Atomist Community Slack)
`),
        );
    }).timeout(1000 * 20);
});
