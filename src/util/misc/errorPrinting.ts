/*
 * Copyright © 2018 Atomist, Inc.
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

import { AxiosError } from "axios";
import * as stringify from "json-stringify-safe";

export function stringifyError(err: Error): string {
    if (isAxiosError(err)) {
        return stringify(removePainfulBits(err));
    }
    return stringify(err);
}

function isAxiosError(err: Error): err is AxiosError {
    const asAxios = err as AxiosError;
    // this is probably close enough
    return asAxios.config && asAxios.config.url && true;
}

function removePainfulBits(err: AxiosError) {
    const usefulBits = {
        // Error
        stack: err.stack,
        message: err.message,
        name: err.name,
        // AxiosError
        code: err.code,
        config: {
            url: err.config.url,
            method: err.config.method,
        },
    };
    return usefulBits;
}
