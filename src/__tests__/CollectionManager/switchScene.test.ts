import { Kernox } from "../../Kernox.js";
import { CollectionManager } from "../../collection/CollectionManager.js";
import { ArrayList } from "../../collection/ArrayList.js";

class TestCollection extends ArrayList {}
class AnotherCollection extends ArrayList {}

describe("CollectionManager.switchScene()", () => {
    let kernox: Kernox;
    let collectionManager: CollectionManager;
    
    beforeEach(() => {
        kernox = new Kernox();
        collectionManager = kernox.collectionManager;
    });

    test("Should switch to a new scene", () => {
        collectionManager.use(TestCollection);
        
        expect(collectionManager.getActiveScene()).toBe("default");
        
        collectionManager.switchScene("level1");
        
        expect(collectionManager.getActiveScene()).toBe("level1");
    });

    test("Should create collection instances for new scene", () => {
        collectionManager.use(TestCollection);
        collectionManager.use(AnotherCollection);
        
        collectionManager.switchScene("level1");
        
        const testCollection = collectionManager.get<TestCollection>("TestCollection");
        const anotherCollection = collectionManager.get<AnotherCollection>("AnotherCollection");
        
        expect(testCollection).toBeInstanceOf(TestCollection);
        expect(anotherCollection).toBeInstanceOf(AnotherCollection);
    });

    test("Should not recreate collections when switching to existing scene", () => {
        collectionManager.use(TestCollection);
        
        collectionManager.switchScene("level1");
        const collection1 = collectionManager.get<TestCollection>("TestCollection");
        
        collectionManager.switchScene("level2");
        collectionManager.switchScene("level1");
        const collection2 = collectionManager.get<TestCollection>("TestCollection");
        
        // Should be the same instance
        expect(collection1).toBe(collection2);
    });

    test("Should do nothing when switching to current scene", () => {
        collectionManager.use(TestCollection);
        
        const collection1 = collectionManager.get<TestCollection>("TestCollection");
        collectionManager.switchScene("default"); // Already on default
        const collection2 = collectionManager.get<TestCollection>("TestCollection");
        
        // Should be the same instance
        expect(collection1).toBe(collection2);
    });

    test("Should create instances for collections registered after scene switch", () => {
        collectionManager.switchScene("level1");
        collectionManager.use(TestCollection);
        
        const collection = collectionManager.get<TestCollection>("TestCollection");
        expect(collection).toBeInstanceOf(TestCollection);
    });
});

