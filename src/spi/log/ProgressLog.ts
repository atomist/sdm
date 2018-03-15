/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Log abstraction for output of our activities.
 * Not a technical log of this project but a log of meaningful activity
 * on behalf of users.
 */
export interface ProgressLog {

    write(what: string): void;

    flush(): Promise<any>;

    close(): Promise<any>;

    /**
     * Some implementations expose their log as a string.
     * Otherwise may not, as it could be too long etc.
     */
    log?: string;

    /**
     * Return the url of the log if it is persisted
     */
    url?: string;
}

export type LogFactory = () => Promise<ProgressLog>;
