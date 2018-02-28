import {
    FingerprintDifferenceInvocation,
    FingerprintDifferenceListener,
} from "../../../common/listener/FingerprintDifferenceListener";

export const diff1: FingerprintDifferenceListener = async (fdi: FingerprintDifferenceInvocation) => {
    console.log(JSON.stringify(fdi.diffs));
    // console.log("HAHA HA diff on " + JSON.stringify(fdi.id) + " of " + diff.map(d => d.newValue.name).join(","));
};
