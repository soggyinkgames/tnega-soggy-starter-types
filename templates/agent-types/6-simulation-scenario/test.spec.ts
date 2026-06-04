import { describe, expect, it } from "vitest";

import config from "./config.js";

describe("agent template config", () => {
    it("enables chat capability", () => {
        expect(config.capabilities).toEqual({ chat: true });
    });
});
