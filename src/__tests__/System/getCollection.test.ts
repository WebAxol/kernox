import { System } from "../../system/System.js";
import { Kernox } from "../../Kernox.js";
import { ArrayList } from "../../collection/ArrayList.js";
import { Entity } from "../../entity/Entity.js";

const kernox = new Kernox();

class TestCollection extends ArrayList {}
class OtherCollection extends ArrayList {}

class TestSystem extends System {
    public execute() {}
}

describe("System.getCollection()", () => {
    let system: TestSystem;

    beforeAll(() => {
        system = new TestSystem(kernox, "testAddon");
        kernox.collectionManager.use(TestCollection, "testAddon");
        kernox.collectionManager.use(OtherCollection, "otherAddon");
    });

    test("Should retrieve collection with system context", () => {
        const collection = system.getCollection("TestCollection");
        
        expect(collection).toBeInstanceOf(TestCollection);
    });

    test("Should retrieve collection with explicit namespace", () => {
        const collection = system.getCollection("otherAddon.OtherCollection");
        
        expect(collection).toBeInstanceOf(OtherCollection);
    });

    test("Should throw error when collection not found", () => {
        expect(() => {
            system.getCollection("NonExistentCollection");
        }).toThrow("Collection 'testAddon.NonExistentCollection' is not registered.");
    });

    test("Should resolve implicit namespace when unambiguous", () => {
        // This test depends on namespace resolution working correctly
        const collection = system.getCollection("TestCollection");
        expect(collection).toBeDefined();
    });
});


