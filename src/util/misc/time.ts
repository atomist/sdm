export function formatDuration(duration: number): string {
    const moment = require("moment");
    // The following require is need to initialize the format function
    require("moment-duration-format");

    return moment.duration(duration, "millisecond").format("h[h] m[m] s[s]");
}
