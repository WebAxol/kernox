import { CollectionManager } from "../../collection/CollectionManager.js";
import { ArrayList } from "../../collection/ArrayList.js";
import { CollectionProxy } from "../../collection/CollectionProxy.js";
import { AbstractCollection } from "../../collection/AbstractCollection.js";
import { Kernox } from "../../Kernox.js";

describe("CollectionManager.unregisterWrapper()", () => {
    let collectionManager: CollectionManager;
    let kernox: Kernox;

    beforeEach(() => {
        kernox = new Kernox();
        collectionManager = new CollectionManager(kernox);
    });

    class Players extends ArrayList {}
    class Enemies extends ArrayList {}

    it("Must unregister a wrapper successfully", () => {
        collectionManager.use(Players);
        const wrapper = collectionManager.getSmartWrapper<Players>("Players");
        
        // Verify wrapper exists
        const wrapper2 = collectionManager.getSmartWrapper<Players>("Players");
        expect(wrapper).toBe(wrapper2);
        
        // Unregister
        collectionManager.unregisterWrapper(wrapper as unknown as CollectionProxy<AbstractCollection>);
        
        // Getting wrapper again should create a new instance
        const wrapper3 = collectionManager.getSmartWrapper<Players>("Players");
        expect(wrapper3).not.toBe(wrapper);
    });

    it("Must not throw when unregistering a non-existent wrapper", () => {
        collectionManager.use(Players);
        const wrapper = collectionManager.getSmartWrapper<Players>("Players");
        
        // Unregister once
        collectionManager.unregisterWrapper(wrapper as unknown as CollectionProxy<AbstractCollection>);
        
        // Unregister again (should not throw)
        expect(() => {
            collectionManager.unregisterWrapper(wrapper as unknown as CollectionProxy<AbstractCollection>);
        }).not.toThrow();
    });

    it("Must allow re-registration after unregistering", () => {
        collectionManager.use(Players);
        const wrapper1 = collectionManager.getSmartWrapper<Players>("Players");
        
        collectionManager.unregisterWrapper(wrapper1 as unknown as CollectionProxy<AbstractCollection>);
        
        // Get wrapper again - should work fine
        const wrapper2 = collectionManager.getSmartWrapper<Players>("Players");
        expect(wrapper2).toBeInstanceOf(CollectionProxy);
        expect(wrapper2.name).toBe("Players");
    });

    it("Must only unregister the specified wrapper", () => {
        collectionManager.use(Players);
        collectionManager.use(Enemies);
        
        const playersWrapper = collectionManager.getSmartWrapper<Players>("Players");
        const enemiesWrapper = collectionManager.getSmartWrapper<Enemies>("Enemies");
        
        // Unregister only Players wrapper
        collectionManager.unregisterWrapper(playersWrapper as unknown as CollectionProxy<AbstractCollection>);
        
        // Enemies wrapper should still be registered
        const enemiesWrapper2 = collectionManager.getSmartWrapper<Enemies>("Enemies");
        expect(enemiesWrapper2).toBe(enemiesWrapper);
        
        // Players wrapper should be new
        const playersWrapper2 = collectionManager.getSmartWrapper<Players>("Players");
        expect(playersWrapper2).not.toBe(playersWrapper);
    });

    it("Must prevent memory leaks by allowing wrapper cleanup", () => {
        collectionManager.use(Players);
        
        // Create and unregister multiple wrappers
        for (let i = 0; i < 10; i++) {
            const wrapper = collectionManager.getSmartWrapper<Players>("Players");
            collectionManager.unregisterWrapper(wrapper as unknown as CollectionProxy<AbstractCollection>);
        }
        
        // Should still work correctly
        const finalWrapper = collectionManager.getSmartWrapper<Players>("Players");
        expect(finalWrapper).toBeInstanceOf(CollectionProxy);
    });
});

