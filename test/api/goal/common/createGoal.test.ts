import { suggestAction } from "../../../../lib/api/goal/common/suggestAction";

describe("createGoal", () => {

    it("should return", () => {
        suggestAction({ displayName: "foo", message: "foo bar"});
    });

});
