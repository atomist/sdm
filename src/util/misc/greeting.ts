import * as os from "os";

const greetings = [
    undefined, // default
    "You can do the thing!",
    "hello, rod",
    "not the rug, man",
    "good morning",
    "greetings from atomist",
];

function randomElement(arr: any[]) {
    return arr[getRandomInt(arr.length)];
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

export function greeting() {
    try {
        const host = os.hostname();
        if (host.includes("Rods-MBP")) {
            return randomElement(greetings);
        }
        return undefined;
    } catch (err) {
        return undefined;
    }
}
