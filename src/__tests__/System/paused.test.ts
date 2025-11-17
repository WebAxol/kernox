import { System } from "../../system/System.js";
import { Kernox } from "../../Kernox.js";

const kernox = new Kernox();

class TestSystem extends System {
    public executeCallCount = 0;
    
    public execute() {
        this.executeCallCount++;
    }
}

describe("System.paused", () => {
    let system: TestSystem;

    beforeEach(() => {
        system = new TestSystem(kernox, "testAddon");
    });

    test("Should be false by default", () => {
        expect(system.paused).toBe(false);
    });

    test("Should allow setting paused state", () => {
        system.paused = true;
        expect(system.paused).toBe(true);
        
        system.paused = false;
        expect(system.paused).toBe(false);
    });

    test("Should prevent execution when paused", () => {
        system.paused = true;
        
        const systemManager = kernox.systemManager;
        systemManager.use(TestSystem, "testAddon");
        
        const registeredSystem = systemManager.get<TestSystem>("testAddon.TestSystem");
        if (registeredSystem) {
            registeredSystem.paused = true;
            systemManager.execute();
            
            // System should not execute when paused
            expect(registeredSystem.executeCallCount).toBe(0);
        }
    });
});


