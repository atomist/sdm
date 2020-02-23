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

import {
    addressSlackChannels,
    addressSlackUsers,
    SlackDestination,
} from "@atomist/automation-client/lib/spi/message/MessageClient";
import * as assert from "assert";
import { fail } from "power-assert";
import { SdmGoalEvent } from "../../../../lib/api/goal/SdmGoalEvent";
import {
    defaultDestinationFactory,
    NotificationOptions,
    notifyGoalCompletionListener,
} from "../../../../lib/core/pack/notification/notification";
import { toArray } from "../../../../lib/core/util/misc/array";
import { SdmGoalState } from "../../../../lib/typings/types";

describe("notification", () => {

    describe("defaultDestinationFactory", () => {

        it("should correctly address the author of the push", async () => {
            const goal: SdmGoalEvent = {
                state: SdmGoalState.failure,
                push: {
                    commits: [{
                        author: {
                            person: {
                                chatId: {
                                    screenName: "bob",
                                    chatTeam: {
                                        id: "Txxxxxx",
                                    },
                                },
                            },
                        },
                    }, {
                        author: {
                            person: {
                                chatId: {
                                    screenName: "bob",
                                    chatTeam: {
                                        id: "Txxxxxx",
                                    },
                                },
                            },
                        },
                    }, {
                        author: {
                            person: {
                                chatId: {
                                    screenName: "joe",
                                    chatTeam: {
                                        id: "Txxxxxx",
                                    },
                                },
                            },
                        },
                    }],
                },
            } as any;
            const destinations = await defaultDestinationFactory(goal);
            assert(!!destinations);
            assert.deepStrictEqual(toArray(destinations).length, 2);
            assert.deepStrictEqual(toArray(destinations)[0], addressSlackUsers("Txxxxxx", "bob"));
            assert.deepStrictEqual(toArray(destinations)[1], addressSlackUsers("Txxxxxx", "joe"));
        });

        it("should mot fail if no chatId is available", async () => {
            const goal: SdmGoalEvent = {
                state: SdmGoalState.failure,
                push: {
                    commits: [{
                        author: {
                            person: {},
                        },
                    }, {
                        author: {
                            person: {
                                chatId: {
                                    screenName: "joe",
                                    chatTeam: {
                                        id: "Txxxxxx",
                                    },
                                },
                            },
                        },
                    }],
                },
            } as any;
            const destinations = await defaultDestinationFactory(goal);
            assert(!!destinations);
            assert.deepStrictEqual(toArray(destinations).length, 1);
            assert.deepStrictEqual(toArray(destinations)[0], addressSlackUsers("Txxxxxx", "joe"));
        });
    });

    describe("notifyGoalCompletionListener", () => {

        it("should not send notification for no destination", async () => {
            const options: NotificationOptions = {
                notification: async gi => {
                    return {
                        message: "Hello",
                        options: {},
                    };
                },
                destination: async () => {
                    return undefined;
                },
            };

            await notifyGoalCompletionListener(options)({
                context: {
                    messageClient: {
                        send: async () => fail(),
                    },
                },
            } as any);

        });

        it("should send notification for one destination", async () => {
            const goal: SdmGoalEvent = {
                state: SdmGoalState.failure,
                name: "Build",
            } as any;
            const options: NotificationOptions = {
                notification: async gi => {
                    return {
                        message: `${gi.completedGoal.name} is ${gi.completedGoal.state}`,
                        options: {},
                    };
                },
                destination: async g => {
                    assert.deepStrictEqual(g, goal);
                    return addressSlackUsers("123456", "joe");
                },
            };

            await notifyGoalCompletionListener(options)({
                completedGoal: goal,
                context: {
                    messageClient: {
                        send: (msg, dests) => {
                            assert.deepStrictEqual(msg, "Build is failure");
                            assert.deepStrictEqual(toArray(dests).length, 1);
                            const dest = dests as SlackDestination;
                            assert.deepStrictEqual(dest.team, "123456");
                            assert.deepStrictEqual(dest.users, ["joe"]);
                            assert.deepStrictEqual(dest.channels.length, 0);
                        },
                    },
                },
            } as any);

        });

        it("should send notification for more destinations", async () => {
            const goal: SdmGoalEvent = {
                state: SdmGoalState.failure,
                name: "Build",
            } as any;
            const options: NotificationOptions = {
                notification: async gi => {
                    return {
                        message: `${gi.completedGoal.name} is ${gi.completedGoal.state}`,
                        options: {},
                    };
                },
                destination: async g => {
                    assert.deepStrictEqual(g, goal);
                    return [
                        addressSlackUsers("123456", "joe"),
                        addressSlackChannels("654321", "general"),
                    ];
                },
            };

            let counter = 0;
            await notifyGoalCompletionListener(options)({
                completedGoal: goal,
                context: {
                    messageClient: {
                        send: (msg, dests) => {
                            assert.deepStrictEqual(msg, "Build is failure");
                            assert.deepStrictEqual(toArray(dests).length, 1);
                            if (counter === 0) {
                                const dest1 = dests as SlackDestination;
                                assert.deepStrictEqual(dest1.team, "123456");
                                assert.deepStrictEqual(dest1.users, ["joe"]);
                                assert.deepStrictEqual(dest1.channels.length, 0);
                                counter++;
                            } else if (counter === 1) {
                                const dest2 = dests as SlackDestination;
                                assert.deepStrictEqual(dest2.team, "654321");
                                assert.deepStrictEqual(dest2.users.length, 0);
                                assert.deepStrictEqual(dest2.channels, ["general"]);
                            }
                        },
                    },
                },
            } as any);

        });

    });

});
