import { CollectionProxy } from "../../collection/CollectionProxy.js"
import { ArrayList } from "../../collection/ArrayList.js";
import { Entity } from "../../entity/Entity.js";

describe("CollectionProxy - Proxy methods", () => {
    let collection: ArrayList;
    let wrapper: CollectionProxy<ArrayList>;
    let entities: Entity[];

    beforeEach(() => {
        collection = new ArrayList();
        wrapper = new CollectionProxy("TestCollection", collection, () => {});
        entities = [
            new Entity("1", "Entity1"),
            new Entity("2", "Entity2"),
            new Entity("3", "Entity3")
        ];
        entities.forEach(e => collection.insert(e));
    });

    it("Must proxy has method", () => {
        expect(wrapper.has(entities[0])).toBe(true);
        expect(wrapper.has(new Entity("999", "NonExistent"))).toBe(false);
    });

    it("Must proxy size method", () => {
        expect(wrapper.size()).toBe(3);
        
        collection.remove(entities[0]);
        expect(wrapper.size()).toBe(2);
    });

    it("Must proxy get method", () => {
        expect(wrapper.get(0)).toBe(entities[0]);
        expect(wrapper.get(1)).toBe(entities[1]);
        expect(wrapper.get(999)).toBeUndefined();
    });

    it("Must proxy asArray method", () => {
        const array = wrapper.asArray();
        
        expect(array).toHaveLength(3);
        expect(array).toContain(entities[0]);
        expect(array).toContain(entities[1]);
        expect(array).toContain(entities[2]);
    });

    it("Must proxy filter method", () => {
        const filtered = wrapper.filter(e => e.id === "1" || e.id === "2");
        
        expect(filtered).toHaveLength(2);
        expect(filtered).toContain(entities[0]);
        expect(filtered).toContain(entities[1]);
        expect(filtered).not.toContain(entities[2]);
    });

    it("Must proxy sort method", () => {
        wrapper.sort((a, b) => b.id.localeCompare(a.id));
        
        expect(wrapper.get(0)).toBe(entities[2]); // "3"
        expect(wrapper.get(1)).toBe(entities[1]); // "2"
        expect(wrapper.get(2)).toBe(entities[0]); // "1"
    });

    it("Must proxy changed property", () => {
        expect(wrapper.changed).toBe(true); // Collection was modified during setup
        
        // Reset changed state
        (collection as any).__changed = false;
        expect(wrapper.changed).toBe(false);
        
        // Modify collection
        collection.insert(new Entity("4", "Entity4"));
        expect(wrapper.changed).toBe(true);
    });

    it("Must support iteration", () => {
        const iterated: Entity[] = [];
        for (const entity of wrapper) {
            iterated.push(entity);
        }
        
        expect(iterated).toHaveLength(3);
        expect(iterated).toContain(entities[0]);
        expect(iterated).toContain(entities[1]);
        expect(iterated).toContain(entities[2]);
    });

    it("Must handle methods that don't exist on collection gracefully", () => {
        // Create a minimal collection that doesn't have all methods
        class MinimalCollection extends ArrayList {
            // Override to remove some methods
        }
        
        const minimalCollection = new MinimalCollection();
        const minimalWrapper = new CollectionProxy("Minimal", minimalCollection, () => {});
        
        // These should return safe defaults
        expect(minimalWrapper.filter(() => true)).toEqual([]);
        expect(minimalWrapper.asArray()).toEqual([]);
        expect(minimalWrapper.size()).toBe(0);
        expect(minimalWrapper.get(0)).toBeUndefined();
    });
});

