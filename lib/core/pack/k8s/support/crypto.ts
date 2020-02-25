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

import * as crypto from "crypto";
import { promisify } from "util";

const algo = "aes-256-cbc";
const algoKeyLength = 32;
const algoIvLength = 16;

/**
 * Encrypt a text string and return is base64 encoded.  The key is
 * used to derive a suitable key and initialization vector.
 *
 * @param text String to be encrypted
 * @param key Secrey key/passphrase to use to encrypt
 * @return Base64 encoded string of encrypted text
 */
export async function encrypt(text: string, key: string): Promise<string> {
    const derivedKey = await deriveKey(key);
    const iv = await deriveKey(derivedKey.toString("base64"), algoIvLength);
    const cipher = crypto.createCipheriv(algo, derivedKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString("base64");
}

/**
 * Decrypt a base64 encoded text string.
 *
 * @param text Base64 encoded string to be decrypted
 * @param key Secrey key/passphrase to use to decrypt, must be the same as the one used to encrypt
 * @return UTF8 encoded string of decrypted text
 */
export async function decrypt(text: string, key: string): Promise<string> {
    const derivedKey = await deriveKey(key);
    const iv = await deriveKey(derivedKey.toString("base64"), algoIvLength);
    const decipher = crypto.createDecipheriv(algo, derivedKey, iv);
    const encryptedText = Buffer.from(text, "base64");
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
}

/**
 * Create an encryption key of length `length` derived using a CPU and
 * memory intensive algorithm.  The `key` is used directly and hashed
 * to generate the salt for the derivation process.
 *
 * @param key Key used to derive encryption key
 * @param length Length of derived key
 * @return Encryption key of length `length`
 */
async function deriveKey(key: string, length: number = algoKeyLength): Promise<Buffer> {
    const pScrypt: (k: string, s: string, l: number) => Promise<Buffer> = promisify(crypto.scrypt);
    const preSalt = Buffer.from(key).toString("base64");
    const salt = crypto.createHash("sha256").update(preSalt).digest("hex");
    return pScrypt(key, salt, length);
}
