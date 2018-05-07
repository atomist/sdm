/*
 * Copyright © 2018 Atomist, Inc.
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
 * Log from which we've been able to glean further information
 * @type D type of additional structured data, if available
 */
export interface InterpretedLog<D = any> {

    /**
     * Relevant part of log to display in UX, if we were able to identify it
     */
    relevantPart: string;

    message: string;

    /**
     * Should the UX include the full log, or is it too long or ugly?
     */
    includeFullLog?: boolean;

    /**
     * Additional structured information from the log, if specified
     */
    data?: D;

    /**
     * Set to true only if we should not bother to report this log to the user
     */
    doNotReportToUser?: boolean;

}

/**
 * Function that can try to interpret a log for display to a user.
 * Return undefined if the log cannot be interpreted.
 */
export type InterpretLog<D = any> = (log: string) => InterpretedLog<D> | undefined;

/**
 * Implemented by types that have the ability to interpret the logs they generate
 */
export interface LogInterpretation {

    logInterpreter: InterpretLog;
}
