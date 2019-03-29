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

import * as df from "dateformat";

/**
 * Format the date with provided format.
 * Defaults to formatting the current UTC date with 'yyyymmddHHMMss' format.
 *
 * @param date Date object to format
 * @param format dateformat compatible format
 * @param utc if true, use UTC time, otherwise use local time zone
 * @return properly formatted date string
 */
export function formatDate(date: Date = new Date(),
                           format: string = "yyyymmddHHMMss",
                           utc: boolean = true): string {
    return df(date, format, utc);
}
