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
        }
    };
    return usefulBits;
}