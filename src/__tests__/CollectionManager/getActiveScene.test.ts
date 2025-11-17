import { Kernox } from "../../Kernox.js";
import { CollectionManager } from "../../collection/CollectionManager.js";

describe("CollectionManager.getActiveScene()", () => {
    let kernox: Kernox;
    let collectionManager: CollectionManager;
    
    beforeEach(() => {
        kernox = new Kernox();
        collectionManager = kernox.collectionManager;
    });

    test("Should return 'default' as initial scene", () => {
        expect(collectionManager.getActiveScene()).toBe("default");
    });

    test("Should return current active scene after switch", () => {
        collectionManager.switchScene("level1");
        expect(collectionManager.getActiveScene()).toBe("level1");
        
        collectionManager.switchScene("menu");
        expect(collectionManager.getActiveScene()).toBe("menu");
        
        collectionManager.switchScene("level2");
        expect(collectionManager.getActiveScene()).toBe("level2");
    });

    test("Should return correct scene after multiple switches", () => {
        collectionManager.switchScene("scene1");
        expect(collectionManager.getActiveScene()).toBe("scene1");
        
        collectionManager.switchScene("scene2");
        expect(collectionManager.getActiveScene()).toBe("scene2");
        
        collectionManager.switchScene("scene1");
        expect(collectionManager.getActiveScene()).toBe("scene1");
    });
});

