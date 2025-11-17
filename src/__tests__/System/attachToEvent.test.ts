import { System } from "../../system/System.js";
import { Kernox } from "../../Kernox.js";

const kernox = new Kernox();

class TestSystem extends System {
    public testHandler: any = null;
    
    public init() {
        this.testHandler = jest.fn();
    }
}

describe("System.attachToEvent()", () => {
    let system: TestSystem;

    beforeAll(() => {
        system = new TestSystem(kernox, "testAddon");
        kernox.use({
            name: "testAddon",
            systems: [TestSystem]
        });
    });

    test("Should attach event handler to event broker", () => {
        const handler = jest.fn();
        const result = system.attachToEvent("testEvent", handler);
        
        expect(result).toBeTruthy();
        
        kernox.eventBroker.dispatch("testAddon.testEvent", { data: "test" });
        expect(handler).toHaveBeenCalledWith({ data: "test" });
    });

    test("Should resolve event name with system context when no namespace provided", () => {
        const handler = jest.fn();
        system.attachToEvent("localEvent", handler);
        
        kernox.eventBroker.dispatch("testAddon.localEvent", {});
        expect(handler).toHaveBeenCalled();
    });

    test("Should use explicit namespace when provided in event name", () => {
        const handler = jest.fn();
        system.attachToEvent("otherAddon.explicitEvent", handler);
        
        kernox.eventBroker.dispatch("otherAddon.explicitEvent", {});
        expect(handler).toHaveBeenCalled();
    });

    test("Should allow multiple handlers for same event", () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        
        system.attachToEvent("multiEvent", handler1);
        system.attachToEvent("multiEvent", handler2);
        
        kernox.eventBroker.dispatch("testAddon.multiEvent", {});
        expect(handler1).toHaveBeenCalled();
        expect(handler2).toHaveBeenCalled();
    });
});


