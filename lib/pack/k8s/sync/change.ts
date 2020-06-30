/*
 * Copyright © 2020 Atomist, Inc.
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

import { configurationValue } from "@atomist/automation-client/lib/configuration";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import * as k8s from "@kubernetes/client-node";
import * as _ from "lodash";
import { KubernetesSyncOptions } from "../config";
import {
    K8sDeleteResponse,
    K8sObjectResponse,
} from "../kubernetes/api";
import { applySpec } from "../kubernetes/apply";
import { deleteSpec } from "../kubernetes/delete";
import { decryptSecret } from "../kubernetes/secret";
import { parseKubernetesSpecs } from "../kubernetes/spec";
import { sameObject } from "./application";
import { PushDiff } from "./diff";
import { previousSpecVersion } from "./previousSpecVersion";

/** Whether a spec should be applied or deleted. */
export type ChangeType = "apply" | "delete";

/**
 * Delete/apply resources in change.  The spec file provided by the
 * change.path may contain multiple specs.  The requested change is
 * applied to each.
 */
export async function changeResource(p: GitProject, change: PushDiff): Promise<void> {
    const beforeContents = await previousSpecVersion(p.baseDir, change.path, change.sha);
    const beforeSpecs = parseKubernetesSpecs(beforeContents);
    let specs: k8s.KubernetesObject[];
    if (change.change !== "delete") {
        const specFile = await p.getFile(change.path);
        if (!specFile) {
            throw new Error(`Resource spec file '${change.path}' does not exist in project`);
        }
        const specContents = await specFile.getContent();
        specs = parseKubernetesSpecs(specContents);
    }
    const changes = calculateChanges(beforeSpecs, specs, change.change);
    const syncOpts = configurationValue<Partial<KubernetesSyncOptions>>("sdm.k8s.options.sync", {});

    for (const specChange of changes) {
        let changer: (spec: k8s.KubernetesObject) => Promise<K8sDeleteResponse | K8sObjectResponse | void>;
        if (specChange.change === "delete") {
            changer = deleteSpec;
        } else {
            changer = applySpec;
        }

        _.set(specChange.spec, "metadata.annotations['atomist.com/sync-sha']", change.sha);

        if (specChange.change !== "delete" && specChange.spec.kind === "Secret" && syncOpts.secretKey) {
            specChange.spec = await decryptSecret(specChange.spec, syncOpts.secretKey);
        }
        await changer(specChange.spec);
    }
}

/** Return type from [[calculateChanges]]. */
export interface SyncChanges {
    /** "apply", "delete" or "ignore" */
    change: ChangeType;
    /** Spec to apply/delete. */
    spec: k8s.KubernetesObject;
}

/**
 * Inspect before and after specs to determine actions.
 *
 * If the action is "delete", return delete actions for all specs in
 * `before` that do not have an ignore annotation for the current SDM,
 * as the "delete" action implies there are no `after` specs.
 *
 * If the action is "apply", return apply actions for all specs in
 * `after` and delete actions for all specs in `before` that are not
 * in `after` that do not have an ignore annotation for the current
 * SDM.  If a `before` spec contains a sync ignore annotation for the
 * current SDM and the `after` annotation does not, the `after` spec
 * with an "apply" action is included in the returned changes.  If an
 * `after` spec contains a sync ignore annotation for the current SDM,
 * then it is omitted from the returned changes, regardless of whether
 * it appears in the `before` specs or not.
 *
 * @param before The specs before the change
 * @param after The specs after the change
 * @param change The type of change
 * @return Array containing the type of change for each spec
 */
export function calculateChanges(
    before: k8s.KubernetesObject[],
    after: k8s.KubernetesObject[] | undefined,
    change: ChangeType,
): SyncChanges[] {

    const beforeFiltered = filterIgnoredSpecs(before);
    if (change === "delete") {
        return beforeFiltered.map(spec => ({ change, spec }));
    }

    const changes: SyncChanges[] = filterIgnoredSpecs(after).map(spec => ({ change, spec }));
    for (const spec of beforeFiltered) {
        if (!after.some(a => sameObject(a, spec))) {
            changes.push({ change: "delete", spec });
        }
    }

    return changes;
}

/**
 * Returned array of specs with those that should be ignored filtered
 * out.
 *
 * @param specs Array of specs to check
 * @return Array of not ignored specs.
 */
export function filterIgnoredSpecs(specs: k8s.KubernetesObject[] | undefined): k8s.KubernetesObject[] {
    if (!specs) {
        return [];
    }
    return specs.filter(spec => !hasMetadataAnnotation(spec, "sync", "ignore"));
}

/**
 * Check if the Kubernetes Object has an annotation that is relevant to the current SDM
 * @param spec the spec to inspect
 * @param annotationKey the key to validate for
 * @param annotationValue the value validate for
 * @returns the result of the annotation inspection
 */
export function hasMetadataAnnotation(spec: k8s.KubernetesObject, annotationKey: string, annotationValue: string): boolean {
    const sdmName = configurationValue<string>("name");
    const nameKey = `atomist.com/sdm-pack-k8s/${annotationKey}/${sdmName}`;
    const specValue = _.get(spec, `metadata.annotations['${nameKey}']`);

    return !!specValue && specValue === annotationValue;
}
