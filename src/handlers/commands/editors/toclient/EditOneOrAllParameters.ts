
import * as assert from "power-assert";

import { Parameters } from "@atomist/automation-client/decorators";
import { BaseEditorOrReviewerParameters } from "@atomist/automation-client/operations/common/params/BaseEditorOrReviewerParameters";
import { SmartParameters } from "@atomist/automation-client/SmartParameters";
import { FallbackReposParameters } from "./FallbackReposParameters";

// TODO move to automation-client

/**
 * Parameters with fallback
 */
@Parameters()
export class EditOneOrAllParameters extends BaseEditorOrReviewerParameters implements SmartParameters {

    constructor() {
        super(new FallbackReposParameters());
    }

    public bindAndValidate() {
        const targets = this.targets as FallbackReposParameters;
        if (!targets.repo) {
            assert(!!targets.repos, "Must set repos or repo");
            targets.repo = targets.repos;
        }
    }

}
