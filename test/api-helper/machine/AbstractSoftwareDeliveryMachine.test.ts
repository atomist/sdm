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

import { Deferred } from "@atomist/automation-client/lib/internal/util/Deferred";
import * as assert from "power-assert";
import { resetRegistrableManager } from "../../../lib/api/machine/Registerable";
import { TriggeredListenerRegistration } from "../../../lib/api/registration/TriggeredListenerRegistration";
import { TestSoftwareDeliveryMachine } from "../TestSoftwareDeliveryMachine";

describe("AbstractSoftwareDeliveryMachine", () => {

    describe("addTriggeredListener", () => {

        afterEach(() => {
            resetRegistrableManager();
        })

        it("should register and schedule cron based trigger", () => {
            let count = 0;
            const job: TriggeredListenerRegistration = {
                trigger: {
                    cron: "*/2 * * * * *",
                },
                listener: async t => {
                    assert(t.sdm);
                    count = count + 1;
                },
            };
            const sdm = new TestSoftwareDeliveryMachine("test");
            sdm.addTriggeredListener(job);
            return sdm.notifyStartupListeners()
                .then(() => {
                    const d = new Deferred<any>();
                    setTimeout(() => {
                        assert(count >= 2);
                        d.resolve();
                    }, 10000);
                    return d.promise;
                });

        }).timeout(11000);

        it("should register and schedule interval based trigger", () => {
            let count = 0;
            const job: TriggeredListenerRegistration = {
                trigger: {
                    interval: 1000,
                },
                listener: async t => {
                    assert(t.sdm);
                    count = count + 1;
                },
            };
            const sdm = new TestSoftwareDeliveryMachine("test");
            sdm.addTriggeredListener(job);
            return sdm.notifyStartupListeners()
                .then(() => {
                    const d = new Deferred<any>();
                    setTimeout(() => {
                        assert(count >= 2);
                        d.resolve();
                    }, 5000);
                    return d.promise;
                });
        }).timeout(6000);
    });

});
