import axios from "axios";
import { AutofixRegistration } from "../../../../common/delivery/code/codeActionRegistrations";
import { hasFile } from "../../../../common/listener/support/pushtest/commonPushTests";
import { not } from "../../../../common/listener/support/pushtest/pushTestUtils";

export const LicenseFilename = "LICENSE";

export const AddLicenseFile: AutofixRegistration = {
    name: "License Fix",
    pushTest: not(hasFile(LicenseFilename)),
    action: async p => {
        const license = await axios.get("https://www.apache.org/licenses/LICENSE-2.0.txt");
        return p.addFile("LICENSE", license.data);
    },
};
