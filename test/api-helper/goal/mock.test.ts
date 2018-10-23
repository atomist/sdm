import assert = require("power-assert");
import {
    MockGoalSize,
    randomize,
} from "../../../lib/api-helper/goal/mock";

describe("mock", () => {

    describe("randomize", () => {

        it("test size", () => {

            const verify = (size, randomBy = 0.2) => {
                const min = size - (size * randomBy);
                const max = size + (size * randomBy);
                const number = randomize(size, randomBy);
                assert(number => min);
                assert(number <= max);
                console.log(number);
            };

            verify(MockGoalSize.ExtraLarge);
            verify(MockGoalSize.ExtraLarge);
            verify(MockGoalSize.ExtraLarge);

            verify(MockGoalSize.Small);
            verify(MockGoalSize.Small);
            verify(MockGoalSize.Small);
            verify(MockGoalSize.Small);

            verify(MockGoalSize.Medium);
            verify(MockGoalSize.Medium);
            verify(MockGoalSize.Medium);
            verify(MockGoalSize.Medium);

        });

    });
});
