import { System } from "../../system/System.js";
import { Kernox } from "../../Kernox.js";

const kernox = new Kernox();

class TestSystem extends System {
    public execute() {}
}

describe("System.context", () => {
    test("Should return the context provided in constructor", () => {
        const system = new TestSystem(kernox, "myAddon");
        expect(system.context).toBe("myAddon");
    });

    test("Should return empty string when no context provided", () => {
        const system = new TestSystem(kernox, "");
        expect(system.context).toBe("");
    });
});


