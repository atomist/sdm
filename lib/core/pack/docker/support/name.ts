/*
 * Copyright © 2019 Atomist, Inc.
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

/**
 * Remove any invalid characters from Docker image name component
 * `name` to make it a valid Docker image name component.  If
 * `hubOwner` is true, it ensures the name contains only alphanumeric
 * characters.
 *
 * From https://docs.docker.com/engine/reference/commandline/tag/:
 *
 * > An image name is made up of slash-separated name components,
 * > optionally prefixed by a registry hostname. The hostname must
 * > comply with standard DNS rules, but may not contain
 * > underscores. If a hostname is present, it may optionally be
 * > followed by a port number in the format :8080. If not present,
 * > the command uses Docker’s public registry located at
 * > registry-1.docker.io by default. Name components may contain
 * > lowercase letters, digits and separators. A separator is defined
 * > as a period, one or two underscores, or one or more dashes. A
 * > name component may not start or end with a separator.
 * >
 * > A tag name must be valid ASCII and may contain lowercase and
 * > uppercase letters, digits, underscores, periods and dashes. A tag
 * > name may not start with a period or a dash and may contain a
 * > maximum of 128 characters.
 *
 * @param name Name component to clean up.
 * @param hubOwner If `true` only allow characters valid for a Docker Hub user/org
 * @return Valid Docker image name component.
 */
export function cleanImageName(name: string, hubOwner: boolean = false): string {
    let clean = name.toLocaleLowerCase()
        .replace(/^[^a-z0-9]+/, "").replace(/[^a-z0-9]+$/, "")
        .replace(/[^-_/.a-z0-9]+/g, "");
    if (hubOwner) {
        clean = clean.replace(/[^a-z0-9]+/g, "");
    }
    if (clean.length > 128) {
        clean = clean.substring(0, 128).replace(/[^a-z0-9]+$/, "");
    }
    return clean;
}
