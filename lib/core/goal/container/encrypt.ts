/*
 * Copyright © 2019 Atomist, Inc.
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

import { loadUserConfiguration } from "@atomist/automation-client/lib/configuration";
import * as crypto from "crypto";

async function encrypt(data: string): Promise<void> {
    const cfg = loadUserConfiguration();
    const encryptionCfp = cfg.sdm.encryption;
    if (!encryptionCfp) {
        throw new Error("Encryption configuration missing to encrypt secret");
    }
    const e = crypto.publicEncrypt(encryptionCfp.publicKey, Buffer.from(data, "utf8"));
    // tslint:disable-next-line:no-console
    console.log(e.toString("base64"));
}
// tslint:disable-next-line:no-floating-promises
encrypt(process.argv[2]);
