import { describe, expect, it } from "vitest";

import config from "./config.js";

describe("agent template config", () => {
    it("declares runtime-expandable capabilities", () => {
        expect(config.capabilities).toEqual({
            enabled: ["chat"],
            availableOnRequest: [],
            disallowed: [],
        });
    });
});
