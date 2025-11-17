import { CollectionManager } from "../../collection/CollectionManager.js";
import { ArrayList } from "../../collection/ArrayList.js";
import { CollectionProxy } from "../../collection/CollectionProxy.js";
import { Kernox } from "../../Kernox.js";
import { Entity } from "../../entity/Entity.js";

describe("CollectionManager.notifyWrappers()", () => {
    let collectionManager: CollectionManager;
    let kernox: Kernox;

    beforeEach(() => {
        kernox = new Kernox();
        collectionManager = new CollectionManager(kernox);
    });

    class Players extends ArrayList {}
    class Enemies extends ArrayList {}

    it("Must update all wrappers for a specific collection when notified", () => {
        collectionManager.use(Players);
        
        const wrapper1 = collectionManager.getSmartWrapper<Players>("Players");
        const wrapper2 = collectionManager.getSmartWrapper<Players>("Players");
        
        // Both should reference the same wrapper
        expect(wrapper1).toBe(wrapper2);
        
        // Create a new collection instance (simulating scene change)
        const newCollection = new Players();
        const entity = new Entity("1", "Player");
        newCollection.insert(entity);
        
        // Notify wrappers
        collectionManager.notifyWrappers("Players", newCollection);
        
        // Wrapper should now reference the new collection
        expect(wrapper1.collection).toBe(newCollection);
        expect(wrapper1.has(entity)).toBe(true);
    });

    it("Must only update wrappers for the specified collection", () => {
        collectionManager.use(Players);
        collectionManager.use(Enemies);
        
        const playersWrapper = collectionManager.getSmartWrapper<Players>("Players");
        const enemiesWrapper = collectionManager.getSmartWrapper<Enemies>("Enemies");
        
        const originalPlayersCollection = playersWrapper.collection;
        const originalEnemiesCollection = enemiesWrapper.collection;
        
        // Create new collection for Players only
        const newPlayersCollection = new Players();
        collectionManager.notifyWrappers("Players", newPlayersCollection);
        
        // Only Players wrapper should be updated
        expect(playersWrapper.collection).toBe(newPlayersCollection);
        expect(playersWrapper.collection).not.toBe(originalPlayersCollection);
        
        // Enemies wrapper should remain unchanged
        expect(enemiesWrapper.collection).toBe(originalEnemiesCollection);
    });

    it("Must handle notifications for collections with no wrappers", () => {
        collectionManager.use(Players);
        
        // Don't create any wrappers, just notify
        const newCollection = new Players();
        
        expect(() => {
            collectionManager.notifyWrappers("Players", newCollection);
        }).not.toThrow();
    });

    it("Must update multiple wrappers for the same collection", () => {
        collectionManager.use(Players);
        
        // Create wrapper
        const wrapper = collectionManager.getSmartWrapper<Players>("Players");
        
        // Add some entities to original collection
        const entity1 = new Entity("1", "Player1");
        wrapper.insert(entity1);
        
        // Create new collection with different entities
        const newCollection = new Players();
        const entity2 = new Entity("2", "Player2");
        newCollection.insert(entity2);
        
        // Notify
        collectionManager.notifyWrappers("Players", newCollection);
        
        // Wrapper should reflect new collection state
        expect(wrapper.has(entity1)).toBe(false);
        expect(wrapper.has(entity2)).toBe(true);
        expect(wrapper.size()).toBe(1);
    });
});

