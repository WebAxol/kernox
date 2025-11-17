import { CollectionProxy } from "../../collection/CollectionProxy.js";
import { ArrayList } from "../../collection/ArrayList.js";
import { Entity } from "../../entity/Entity.js";

describe("CollectionProxy - Basic functionality", () => {
    let collection: ArrayList;
    let wrapper: CollectionProxy<ArrayList>;
    let updateCallback: jest.Mock;

    beforeEach(() => {
        collection = new ArrayList();
        updateCallback = jest.fn();
        wrapper = new CollectionProxy("TestCollection", collection, updateCallback);
    });

    it("Must initialize with the provided collection", () => {
        expect(wrapper.collection).toBe(collection);
        expect(wrapper.name).toBe("TestCollection");
    });

    it("Must proxy insert method to underlying collection", () => {
        const entity = new Entity("1", "TestEntity");
        const result = wrapper.insert(entity);
        
        expect(result).toBe(true);
        expect(collection.has(entity)).toBe(true);
        expect(wrapper.has(entity)).toBe(true);
    });

    it("Must proxy remove method to underlying collection", () => {
        const entity = new Entity("1", "TestEntity");
        collection.insert(entity);
        
        const result = wrapper.remove(entity);
        
        expect(result).toBe(true);
        expect(collection.has(entity)).toBe(false);
        expect(wrapper.has(entity)).toBe(false);
    });

    it("Must return false when inserting duplicate entity", () => {
        const entity = new Entity("1", "TestEntity");
        wrapper.insert(entity);
        
        const result = wrapper.insert(entity);
        
        expect(result).toBe(false);
    });

    it("Must return false when removing non-existent entity", () => {
        const entity = new Entity("1", "TestEntity");
        
        const result = wrapper.remove(entity);
        
        expect(result).toBe(false);
    });

    it("Must update collection reference when updateCollection is called", () => {
        const newCollection = new ArrayList();
        const entity = new Entity("1", "TestEntity");
        newCollection.insert(entity);
        
        wrapper.updateCollection(newCollection);
        
        expect(wrapper.collection).toBe(newCollection);
        expect(wrapper.has(entity)).toBe(true);
        expect(updateCallback).toHaveBeenCalledWith(wrapper);
    });

    it("Must call update callback when collection is updated", () => {
        const newCollection = new ArrayList();
        
        wrapper.updateCollection(newCollection);
        
        expect(updateCallback).toHaveBeenCalledTimes(1);
        expect(updateCallback).toHaveBeenCalledWith(wrapper);
    });
});

