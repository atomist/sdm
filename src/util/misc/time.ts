export function formatDuration(duration: number): string {
    const moment = require("moment");
    // The following require is needed to initialize the format function
    const momentDurationFormatSetup = require("moment-duration-format");
    momentDurationFormatSetup(moment);

    return moment.duration(duration, "millisecond").format("h[h] m[m] s[s]");
}
