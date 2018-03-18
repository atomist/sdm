import * as base64 from "base64-js";

export function encode(str: string): string {
    const arr: number[] = [];
    for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i));
    }
    const coded = base64.fromByteArray(arr);
    return coded;
}

export function decode(coded: string): string {
    const decoded = base64.toByteArray(coded);
    return String.fromCharCode.apply(null, decoded);
}
