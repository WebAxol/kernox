import { CollectionManager } from "../../collection/CollectionManager.js";
import { ArrayList } from "../../collection/ArrayList.js";
import { CollectionProxy } from "../../collection/CollectionProxy.js";
import { Entity } from "../../entity/Entity.js";
import { Kernox } from "../../Kernox.js";

describe("CollectionManager.getSmartWrapper()", () => {
    let collectionManager: CollectionManager;
    let kernox: Kernox;

    beforeEach(() => {
        kernox = new Kernox();
        collectionManager = new CollectionManager(kernox);
    });

    class Players extends ArrayList {}
    class Enemies extends ArrayList {}

    it("Must throw an error if collection is not registered", () => {
        expect(() => {
            collectionManager.getSmartWrapper("NonExistent");
        }).toThrow(Error(`Collection 'NonExistent' is not registered.`));
    });

    it("Must create a new wrapper for a registered collection", () => {
        collectionManager.use(Players);
        
        const wrapper = collectionManager.getSmartWrapper<Players>("Players");
        
        expect(wrapper).toBeInstanceOf(CollectionProxy);
        expect(wrapper.name).toBe("Players");
        expect(wrapper.collection).toBeInstanceOf(Players);
    });

    it("Must return the same wrapper instance for the same collection name", () => {
        collectionManager.use(Players);
        
        const wrapper1 = collectionManager.getSmartWrapper<Players>("Players");
        const wrapper2 = collectionManager.getSmartWrapper<Players>("Players");
        
        expect(wrapper1).toBe(wrapper2);
    });

    it("Must create separate wrappers for different collections", () => {
        collectionManager.use(Players);
        collectionManager.use(Enemies);
        
        const playersWrapper = collectionManager.getSmartWrapper<Players>("Players");
        const enemiesWrapper = collectionManager.getSmartWrapper<Enemies>("Enemies");
        
        expect(playersWrapper).not.toBe(enemiesWrapper);
        expect(playersWrapper.name).toBe("Players");
        expect(enemiesWrapper.name).toBe("Enemies");
    });

    it("Must work with namespaced collections", () => {
        collectionManager.use(Players, "game");
        
        const wrapper = collectionManager.getSmartWrapper<Players>("game.Players");
        
        expect(wrapper).toBeInstanceOf(CollectionProxy);
        expect(wrapper.name).toBe("game.Players");
    });

    it("Must proxy collection operations correctly", () => {
        collectionManager.use(Players);
        const wrapper = collectionManager.getSmartWrapper<Players>("Players");
        
        const entity = new Entity("1", "Player");
        
        wrapper.insert(entity);
        
        const directCollection = collectionManager.get<Players>("Players");
        expect(directCollection.has(entity)).toBe(true);
        expect(wrapper.has(entity)).toBe(true);
    });
});

