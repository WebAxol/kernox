import { System } from "../../system/System.js";
import { Kernox } from "../../Kernox.js";

const kernox = new Kernox();

class TestSystem extends System {
    public execute() {}
}

describe("System.dispatchEvent()", () => {
    let system: TestSystem;

    beforeAll(() => {
        system = new TestSystem(kernox, "testAddon");
        kernox.use({
            name: "testAddon",
            systems: [TestSystem]
        });
    });

    test("Should dispatch event with system context", () => {
        const handler = jest.fn();
        kernox.eventBroker.attachToEvent("testAddon.testEvent", handler);
        
        system.dispatchEvent("testEvent", { data: "test" });
        
        expect(handler).toHaveBeenCalledWith({ data: "test" });
    });

    test("Should dispatch event with explicit namespace", () => {
        const handler = jest.fn();
        kernox.eventBroker.attachToEvent("otherAddon.explicitEvent", handler);
        
        system.dispatchEvent("otherAddon.explicitEvent", { value: 42 });
        
        expect(handler).toHaveBeenCalledWith({ value: 42 });
    });

    test("Should dispatch event without details", () => {
        const handler = jest.fn();
        kernox.eventBroker.attachToEvent("testAddon.simpleEvent", handler);
        
        system.dispatchEvent("simpleEvent", {});
        
        expect(handler).toHaveBeenCalledWith({});
    });
});


