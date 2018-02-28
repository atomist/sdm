
import * as jsSHA from "jssha";

export function isValidSHA1(s: string): boolean {
    return s.match(/[a-fA-F0-9]{40}/) != null;
}

export function computeShaOf(s: string): string {
    const shaObj = new jsSHA("SHA-512", "TEXT");
    shaObj.update(s);
    return shaObj.getHash("HEX");
}
