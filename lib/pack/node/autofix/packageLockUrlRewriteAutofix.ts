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

import { hasFile } from "../../../api/mapping/support/commonPushTests";
import { AutofixRegistration } from "../../../api/registration/AutofixRegistration";

const PackageLock = "package-lock.json";

/**
 * Autofix to replace http registry links with https ones.
 *
 * Apparently the issue is fixed in npm but we are still seeing http link every once in a while:
 * https://npm.community/t/some-packages-have-dist-tarball-as-http-and-not-https/285
 */
export const PackageLockUrlRewriteAutofix: AutofixRegistration = {
    name: "NPM package lock",
    pushTest: hasFile(PackageLock),
    transform: async p => {
        const packageLock = await p.getFile(PackageLock);
        const packageLockContent = (await packageLock.getContent()).replace(/http:/g, "https:");
        await packageLock.setContent(packageLockContent);
        return p;
    },
};
