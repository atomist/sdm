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

import * as stringify from "json-stringify-safe";
import * as request from "request";

/**
 * Extract message from a variety of error types.  If message is not
 * found in any of the standard places, safely stringify the error.
 *
 * @param e Some sort of Error or similar
 * @return Error message
 */
export function errMsg(e: any): string {
    if (!e) {
        return stringify(e);
    } else if (typeof e === "string") {
        return e;
    } else if (Array.isArray(e)) {
        return stringify(e);
    } else if (e.message && typeof e.message === "string") {
        return e.message;
    } else if (requestErrMsg(e)) {
        return requestErrMsg(e);
    } else {
        return stringify(e, keyFilter);
    }
}

/** Interface to package request response and body. */
export interface RequestResponse {
    response: request.Response;
    body: any;
}

/**
 * Extract an error message from the error object, which may have
 * derived from a request response.
 *
 * @param e Some sort of Error or similar
 * @return Error message if found, `undefined` otherwise
 */
export function requestErrMsg(e: Partial<RequestResponse>): string | undefined {
    if (e.body && typeof e.body === "string") {
        return e.body;
    } else if (e.body && e.body.message && typeof e.body.message === "string") {
        return e.body.message;
    } else if (e.response && e.response.body && typeof e.response.body === "string") {
        return e.response.body;
    } else if (e.response && e.response.body && e.response.body.message && typeof e.response.body.message === "string") {
        return e.response.body.message;
    } else {
        return undefined;
    }
}

/**
 * Create an Error object from a request response and body.  The
 * response and body will be included in the Error object.
 *
 * @param r Request response and body
 * @return Error object with meaningful message, if possible
 */
export function requestError(r: RequestResponse): Error & RequestResponse {
    const msg = requestErrMsg(r) || "Kubernetes API request failed";
    const e = new Error(msg);
    (e as any).response = r.response;
    (e as any).body = r.body;
    return e as any as Error & RequestResponse;
}

/** Omit possibly secret values from stringified object. */
function keyFilter<T>(key: string, value: T): T | string | undefined {
    if (/secret|token|password|jwt|url|secret|auth|key|cert|pass|user/i.test(key)) {
        if (typeof value === "string") {
            return maskString(value);
        }
        return undefined;
    }
    return value;
}

/**
 * Mask a string containing potentially sensitive information.
 *
 * @param raw String to mask
 * @return Masked string
 */
export function maskString(raw: string): string {
    const l = raw.length;
    if (l < 7) {
        return "******";
    } else if (l < 16) {
        return "*".repeat(raw.length);
    } else if (l < 50) {
        return raw.charAt(0) + "*".repeat(raw.length - 2) + raw.charAt(raw.length - 1);
    } else {
        return raw.charAt(0) + "*".repeat(45) + raw.charAt(46) + "...";
    }
}
