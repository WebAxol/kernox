import { CollectionProxy } from "../../collection/CollectionProxy.js"
import { ArrayList } from "../../collection/ArrayList.js";
import { Entity } from "../../entity/Entity.js";

describe("CollectionProxy - Scene changes", () => {
    let collection1: ArrayList;
    let collection2: ArrayList;
    let wrapper: CollectionProxy<ArrayList>;
    let updateCallback: jest.Mock;

    beforeEach(() => {
        collection1 = new ArrayList();
        collection2 = new ArrayList();
        updateCallback = jest.fn();
        wrapper = new CollectionProxy("TestCollection", collection1, updateCallback);
    });

    it("Must maintain entity operations after scene change", () => {
        const entity1 = new Entity("1", "Entity1");
        const entity2 = new Entity("2", "Entity2");
        const entity3 = new Entity("3", "Entity3");
        
        // Add entities to first collection
        collection1.insert(entity1);
        wrapper.insert(entity2);
        
        expect(wrapper.size()).toBe(2);
        expect(wrapper.has(entity1)).toBe(true);
        expect(wrapper.has(entity2)).toBe(true);
        
        // Switch to new collection (scene change)
        collection2.insert(entity3);
        wrapper.updateCollection(collection2);
        
        // Wrapper should now reflect new collection
        expect(wrapper.size()).toBe(1);
        expect(wrapper.has(entity1)).toBe(false);
        expect(wrapper.has(entity2)).toBe(false);
        expect(wrapper.has(entity3)).toBe(true);
    });

    it("Must update internal state after scene change", () => {
        const entity = new Entity("1", "Entity1");
        collection1.insert(entity);
        
        expect(wrapper.has(entity)).toBe(true);
        
        wrapper.updateCollection(collection2);
        
        expect(wrapper.has(entity)).toBe(false);
        expect(wrapper.size()).toBe(0);
    });

    it("Must allow operations on new collection after scene change", () => {
        wrapper.updateCollection(collection2);
        
        const entity = new Entity("1", "Entity1");
        wrapper.insert(entity);
        
        expect(collection2.has(entity)).toBe(true);
        expect(wrapper.has(entity)).toBe(true);
    });

    it("Must call update callback on each scene change", () => {
        wrapper.updateCollection(collection2);
        expect(updateCallback).toHaveBeenCalledTimes(1);
        
        wrapper.updateCollection(collection1);
        expect(updateCallback).toHaveBeenCalledTimes(2);
        
        wrapper.updateCollection(collection2);
        expect(updateCallback).toHaveBeenCalledTimes(3);
    });

    it("Must maintain collection name across scene changes", () => {
        expect(wrapper.name).toBe("TestCollection");
        
        wrapper.updateCollection(collection2);
        expect(wrapper.name).toBe("TestCollection");
        
        wrapper.updateCollection(collection1);
        expect(wrapper.name).toBe("TestCollection");
    });
});

